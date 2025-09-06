import { Job, JobStatus, ContributionJobData, JobSummary, QueueStats } from '../types/job.types';
import { ContributeService } from './contribute.service';
import { LoggerUtil } from '../utils';

export class ContributionQueueService {
    private static instance: ContributionQueueService;
    private jobs: Map<string, Job> = new Map();
    private queue: string[] = []; // Queue of job IDs
    private isProcessing: boolean = false;
    private workerInterval?: NodeJS.Timeout;
    private contributeService: ContributeService;

    // Cleanup old jobs after 24 hours
    private readonly JOB_CLEANUP_HOURS = 24;
    private readonly MAX_CONCURRENT_JOBS = 1; // Process one at a time to avoid overload

    private constructor() {
        this.contributeService = new ContributeService();
        this.startWorker();
        this.startCleanupTimer();
    }

    static getInstance(): ContributionQueueService {
        if (!ContributionQueueService.instance) {
            ContributionQueueService.instance = new ContributionQueueService();
        }
        return ContributionQueueService.instance;
    }

    /**
     * Add a new contribution job to the queue
     */
    async addJob(data: ContributionJobData): Promise<string> {
        const jobId = this.generateJobId(data.campaignId);
        
        const job: Job = {
            id: jobId,
            type: 'contribution',
            data,
            status: 'queued',
            createdAt: new Date(),
            progress: 0
        };

        this.jobs.set(jobId, job);
        this.queue.push(jobId);

        LoggerUtil.logServiceOperation('ContributionQueueService', 'addJob', {
            jobId,
            campaignId: data.campaignId,
            fileName: data.file.originalname,
            queueLength: this.queue.length
        });

        // Start processing if not already running
        this.processNext();

        return jobId;
    }

    /**
     * Get job status by ID
     */
    getJob(jobId: string): JobSummary | null {
        const job = this.jobs.get(jobId);
        if (!job) return null;

        return {
            id: job.id,
            status: job.status,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error,
            progress: job.progress || 0,
            campaignId: job.data.campaignId,
            fileName: job.data.file.originalname
        };
    }

    /**
     * Get all jobs for a campaign
     */
    getCampaignJobs(campaignId: number): JobSummary[] {
        const campaignJobs: JobSummary[] = [];
        
        for (const job of this.jobs.values()) {
            if (job.data.campaignId === campaignId) {
                campaignJobs.push({
                    id: job.id,
                    status: job.status,
                    createdAt: job.createdAt,
                    startedAt: job.startedAt,
                    completedAt: job.completedAt,
                    error: job.error,
                    progress: job.progress || 0,
                    campaignId: job.data.campaignId,
                    fileName: job.data.file.originalname
                });
            }
        }

        // Sort by creation date (newest first)
        return campaignJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    /**
     * Get queue statistics
     */
    getStats(): QueueStats {
        const stats: QueueStats = {
            queued: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            totalJobs: this.jobs.size
        };

        for (const job of this.jobs.values()) {
            stats[job.status]++;
        }

        return stats;
    }

    /**
     * Process the next job in queue
     */
    private async processNext(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const jobId = this.queue.shift();
        
        if (!jobId) {
            this.isProcessing = false;
            return;
        }

        const job = this.jobs.get(jobId);
        if (!job) {
            this.isProcessing = false;
            return;
        }

        try {
            // Update job status to processing
            job.status = 'processing';
            job.startedAt = new Date();
            job.progress = 10;

            LoggerUtil.logServiceOperation('ContributionQueueService', 'processNext - started', {
                jobId,
                campaignId: job.data.campaignId,
                fileName: job.data.file.originalname
            });

            // Update progress during processing
            job.progress = 30;

            // Process the contribution
            const result = await this.contributeService.processContribution({
                walletAddress: job.data.walletAddress,
                email: job.data.email,
                name: job.data.name,
                sub: job.data.sub,
                campaignId: job.data.campaignId,
                file: job.data.file
            });

            // Job completed successfully
            job.status = 'completed';
            job.completedAt = new Date();
            job.progress = 100;
            job.result = result;

            LoggerUtil.logServiceOperation('ContributionQueueService', 'processNext - completed', {
                jobId,
                campaignId: job.data.campaignId,
                fileName: job.data.file.originalname,
                processingTimeMs: job.completedAt.getTime() - job.startedAt!.getTime()
            });

        } catch (error) {
            // Job failed
            job.status = 'failed';
            job.completedAt = new Date();
            job.error = error instanceof Error ? error.message : 'Unknown error occurred';
            job.progress = 0;

            LoggerUtil.logServiceError('ContributionQueueService', 'processNext - failed', error, {
                jobId,
                campaignId: job.data.campaignId,
                fileName: job.data.file.originalname
            });
        } finally {
            this.isProcessing = false;
            
            // Process next job if any
            setTimeout(() => this.processNext(), 100);
        }
    }

    /**
     * Start the worker to process jobs
     */
    private startWorker(): void {
        // Check for jobs every 5 seconds
        this.workerInterval = setInterval(() => {
            if (!this.isProcessing && this.queue.length > 0) {
                this.processNext();
            }
        }, 5000);

        LoggerUtil.logServiceOperation('ContributionQueueService', 'startWorker', {
            workerEnabled: true,
            checkIntervalMs: 5000
        });
    }

    /**
     * Start cleanup timer to remove old jobs
     */
    private startCleanupTimer(): void {
        // Clean up every hour
        setInterval(() => {
            this.cleanupOldJobs();
        }, 60 * 60 * 1000);
    }

    /**
     * Clean up old completed/failed jobs
     */
    private cleanupOldJobs(): void {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - this.JOB_CLEANUP_HOURS);

        let cleanedCount = 0;
        
        for (const [jobId, job] of this.jobs.entries()) {
            const jobTime = job.completedAt || job.createdAt;
            
            if ((job.status === 'completed' || job.status === 'failed') && 
                jobTime < cutoffTime) {
                this.jobs.delete(jobId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            LoggerUtil.logServiceOperation('ContributionQueueService', 'cleanupOldJobs', {
                cleanedJobs: cleanedCount,
                remainingJobs: this.jobs.size
            });
        }
    }

    /**
     * Generate unique job ID
     */
    private generateJobId(campaignId: number): string {
        return `job_${campaignId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Shutdown the queue service
     */
    shutdown(): void {
        if (this.workerInterval) {
            clearInterval(this.workerInterval);
        }
        
        LoggerUtil.logServiceOperation('ContributionQueueService', 'shutdown', {
            pendingJobs: this.queue.length,
            totalJobs: this.jobs.size
        });
    }
}