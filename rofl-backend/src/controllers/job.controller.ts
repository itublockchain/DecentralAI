import { Request, Response } from 'express';
import { ContributionQueueService } from '../services/contribution-queue.service';
import { LoggerUtil, ResponseUtil } from '../utils';

export class JobController {
    private queueService: ContributionQueueService;

    constructor() {
        this.queueService = ContributionQueueService.getInstance();
    }

    /**
     * GET /api/jobs/:jobId
     * Get job status by ID
     */
    async getJobStatus(req: Request, res: Response): Promise<Response> {
        try {
            const { jobId } = req.params;

            if (!jobId) {
                return ResponseUtil.badRequest(res, 'Job ID is required');
            }

            LoggerUtil.logControllerOperation('JobController', 'getJobStatus', {
                jobId
            });

            const job = this.queueService.getJob(jobId);

            if (!job) {
                return ResponseUtil.badRequest(res, 'Job not found');
            }

            LoggerUtil.logControllerOperation('JobController', 'getJobStatus - completed', {
                jobId,
                status: job.status,
                progress: job.progress
            });

            return ResponseUtil.success(res, job, 'Job status retrieved successfully');

        } catch (error) {
            LoggerUtil.logControllerError('JobController', 'getJobStatus', error, {
                jobId: req.params?.jobId
            });

            return ResponseUtil.internalServerError(res, 'Failed to get job status');
        }
    }

    /**
     * GET /api/campaigns/:campaignId/jobs
     * Get all jobs for a campaign
     */
    async getCampaignJobs(req: Request, res: Response): Promise<Response> {
        try {
            const { campaignId } = req.params;

            if (!campaignId) {
                return ResponseUtil.badRequest(res, 'Campaign ID is required');
            }

            const parsedCampaignId = parseInt(campaignId, 10);
            if (isNaN(parsedCampaignId) || parsedCampaignId <= 0) {
                return ResponseUtil.badRequest(res, 'Invalid campaign ID');
            }

            LoggerUtil.logControllerOperation('JobController', 'getCampaignJobs', {
                campaignId: parsedCampaignId
            });

            const jobs = this.queueService.getCampaignJobs(parsedCampaignId);

            LoggerUtil.logControllerOperation('JobController', 'getCampaignJobs - completed', {
                campaignId: parsedCampaignId,
                jobCount: jobs.length
            });

            return ResponseUtil.success(res, jobs, 'Campaign jobs retrieved successfully');

        } catch (error) {
            LoggerUtil.logControllerError('JobController', 'getCampaignJobs', error, {
                campaignId: req.params?.campaignId
            });

            return ResponseUtil.internalServerError(res, 'Failed to get campaign jobs');
        }
    }

    /**
     * GET /api/jobs/stats
     * Get queue statistics
     */
    async getQueueStats(req: Request, res: Response): Promise<Response> {
        try {
            LoggerUtil.logControllerOperation('JobController', 'getQueueStats', {});

            const stats = this.queueService.getStats();

            LoggerUtil.logControllerOperation('JobController', 'getQueueStats - completed', {
                stats
            });

            return ResponseUtil.success(res, stats, 'Queue statistics retrieved successfully');

        } catch (error) {
            LoggerUtil.logControllerError('JobController', 'getQueueStats', error);

            return ResponseUtil.internalServerError(res, 'Failed to get queue statistics');
        }
    }
}