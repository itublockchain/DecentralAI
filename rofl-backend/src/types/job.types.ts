export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ContributionJobData {
    walletAddress: string;
    email: string;
    name?: string;
    sub: string;
    campaignId: number;
    file: Express.Multer.File;
}

export interface ModelCampaignJobData {
    name: string;
    description: string;
    owner: string;
    category: number;
    in_token_price: string;
    out_token_price: string;
    file: Express.Multer.File;
}

export interface Job {
    id: string;
    type: 'contribution' | 'model-campaign';
    data: ContributionJobData | ModelCampaignJobData;
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
    type: 'contribution' | 'model-campaign';
    status: JobStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    progress?: number;
    campaignId?: number; // Optional for model-campaign jobs
    fileName: string;
}

export interface QueueStats {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    totalJobs: number;
}