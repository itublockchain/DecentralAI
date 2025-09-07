import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ContributionQueueService } from '../services/contribution-queue.service';

const queueService = ContributionQueueService.getInstance();

export const contribute = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated'
            });
        }

        const file = req.file;

        if (!file) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'File is required'
            });
        }


        const { campaignId } = req.params;
        const parsedCampaignId = parseInt(campaignId || '0');

        if (!campaignId || isNaN(parsedCampaignId) || parsedCampaignId < 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Valid campaign ID is required'
            });
        }

        // Add job to queue for async processing
        const jobId = await queueService.addContributionJob({
            walletAddress: user.walletAddress,
            email: user.email,
            name: user.name,
            sub: user.sub,
            file,
            campaignId: parsedCampaignId
        });

        // Return immediate response with job ID
        return res.status(202).json({
            success: true,
            message: 'File uploaded and queued for processing',
            data: {
                jobId,
                campaignId: parsedCampaignId,
                status: 'queued',
                fileName: file.originalname
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error in contribute controller', { error });
        next(error);
    }
};