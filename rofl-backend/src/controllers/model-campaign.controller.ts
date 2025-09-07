import { Request, Response } from 'express';
import { ModelCampaignService } from '../services/model-campaign.service';
import { ContributionQueueService } from '../services/contribution-queue.service';
import { ModelCampaignRequest } from '../types/campaign.types';
import { LoggerUtil } from '../utils/logger.util';
import { ValidationUtil } from '../utils/validation.util';

export class ModelCampaignController {
    private modelCampaignService: ModelCampaignService;
    private queueService: ContributionQueueService;

    constructor() {
        this.modelCampaignService = new ModelCampaignService();
        this.queueService = ContributionQueueService.getInstance();
    }

    async createModelCampaign(req: Request, res: Response): Promise<void> {
        try {
            // Validate required fields
            const { name, description, owner, category, in_token_price, out_token_price } = req.body;
            
            if (!name?.trim()) {
                res.status(400).json({
                    success: false,
                    message: 'Campaign name is required',
                    data: null
                });
                return;
            }

            if (!description?.trim()) {
                res.status(400).json({
                    success: false,
                    message: 'Campaign description is required',
                    data: null
                });
                return;
            }

            if (!owner || !ValidationUtil.isValidAddress(owner)) {
                res.status(400).json({
                    success: false,
                    message: 'Valid owner address is required',
                    data: null
                });
                return;
            }

            if (category === undefined || category === null) {
                res.status(400).json({
                    success: false,
                    message: 'Campaign category is required',
                    data: null
                });
                return;
            }

            if (!in_token_price) {
                res.status(400).json({
                    success: false,
                    message: 'in_token_price is required',
                    data: null
                });
                return;
            }

            if (!out_token_price) {
                res.status(400).json({
                    success: false,
                    message: 'out_token_price is required',
                    data: null
                });
                return;
            }

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'Initial data file is required',
                    data: null
                });
                return;
            }

            LoggerUtil.logControllerOperation('ModelCampaignController', 'createModelCampaign - queuing job', {
                name,
                owner,
                category,
                fileName: req.file.originalname,
                fileSize: req.file.size
            });

            // Add job to queue for async processing
            const jobId = await this.queueService.addModelCampaignJob({
                name: name.trim(),
                description: description.trim(),
                owner,
                category: parseInt(category),
                in_token_price,
                out_token_price,
                file: req.file
            });

            // Return immediate response with job ID
            res.status(202).json({
                success: true,
                message: 'Model campaign creation queued for processing',
                data: {
                    jobId,
                    status: 'queued',
                    fileName: req.file.originalname,
                    campaignName: name.trim()
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            LoggerUtil.logControllerError('ModelCampaignController', 'createModelCampaign', error, {
                fileName: req.file?.originalname,
                fileSize: req.file?.size,
                owner: req.body?.owner
            });

            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to queue model campaign creation',
                data: null
            });
        }
    }

    async getCampaignDetails(req: Request, res: Response): Promise<void> {
        try {
            const { campaignId } = req.params;
            
            if (!campaignId || !ValidationUtil.isNumeric(campaignId)) {
                res.status(400).json({
                    success: false,
                    message: 'Valid campaign ID is required',
                    data: null
                });
                return;
            }

            const campaign = await this.modelCampaignService.getCampaignDetails(parseInt(campaignId));

            res.json({
                success: true,
                message: 'Campaign details retrieved successfully',
                data: campaign
            });

        } catch (error) {
            LoggerUtil.logControllerError('ModelCampaignController', 'getCampaignDetails', error, {
                campaignId: req.params?.campaignId
            });

            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get campaign details',
                data: null
            });
        }
    }

    async getTotalCampaigns(req: Request, res: Response): Promise<void> {
        try {
            const totalCampaigns = await this.modelCampaignService.getTotalCampaigns();

            res.json({
                success: true,
                message: 'Total campaigns retrieved successfully',
                data: { totalCampaigns }
            });

        } catch (error) {
            LoggerUtil.logControllerError('ModelCampaignController', 'getTotalCampaigns', error);

            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get total campaigns',
                data: null
            });
        }
    }
}