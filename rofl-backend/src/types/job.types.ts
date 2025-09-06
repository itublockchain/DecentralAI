export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ContributionJobData {
    walletAddress: string;
    email: string;
    name?: string;
    sub: string;
    campaignId: number;
    file: Express.Multer.File;
}

export interface Job {
    id: string;
    type: 'contribution';
    data: ContributionJobData;
    status: JobStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    result?: any;
    progress?: number; // 0-100
}

export interface JobSummary {
    id: string;
    status: JobStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    progress?: number;
    campaignId: number;
    fileName: string;
}

export interface QueueStats {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    totalJobs: number;
}