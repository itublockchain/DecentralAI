import { Request, Response } from 'express';
import { CampaignQueryService } from '../services/campaign-query.service';
import { LoggerUtil, ValidationUtil, ResponseUtil } from '../utils';

export class CampaignQueryController {
    private queryService: CampaignQueryService;

    constructor() {
        this.queryService = new CampaignQueryService();
    }

    /**
     * POST /api/campaigns/:campaignId/query
     * Query a specific campaign's knowledge base
     */
    async query(req: Request, res: Response): Promise<Response> {
        try {
            const { campaignId } = req.params;
            const { query, topK, minSimilarity } = req.body;

            // Validate campaign ID
            if (!campaignId) {
                return ResponseUtil.badRequest(res, 'Campaign ID is required');
            }

            const parsedCampaignId = parseInt(campaignId, 10);
            if (!Number.isInteger(parsedCampaignId) || parsedCampaignId <= 0) {
                return ResponseUtil.badRequest(res, 'Invalid campaign ID');
            }

            // Validate query
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                return ResponseUtil.badRequest(res, 'Query is required and must be a non-empty string');
            }

            if (query.length > 5000) {
                return ResponseUtil.badRequest(res, 'Query is too long (maximum 5000 characters)');
            }

            // Validate optional parameters
            const validatedTopK = topK ? parseInt(topK, 10) : undefined;
            if (validatedTopK && (!Number.isInteger(validatedTopK) || validatedTopK < 1 || validatedTopK > 20)) {
                return ResponseUtil.badRequest(res, 'topK must be an integer between 1 and 20');
            }

            const validatedMinSimilarity = minSimilarity ? parseFloat(minSimilarity) : undefined;
            if (validatedMinSimilarity && (validatedMinSimilarity < 0 || validatedMinSimilarity > 1)) {
                return ResponseUtil.badRequest(res, 'minSimilarity must be a number between 0 and 1');
            }

            LoggerUtil.logControllerOperation('CampaignQueryController', 'query', {
                campaignId: parsedCampaignId,
                queryLength: query.length,
                topK: validatedTopK,
                minSimilarity: validatedMinSimilarity,
                userAgent: req.headers['user-agent']
            });

            // Check if service is ready
            const isReady = await this.queryService.isServiceReady();
            if (!isReady) {
                return ResponseUtil.serviceUnavailable(res, 'Query service is not ready. Please try again in a moment.');
            }

            // Process the query
            const result = await this.queryService.queryWithRAG({
                query: query.trim(),
                campaignId: parsedCampaignId,
                topK: validatedTopK,
                minSimilarity: validatedMinSimilarity
            });

            LoggerUtil.logControllerOperation('CampaignQueryController', 'query - completed', {
                campaignId: parsedCampaignId,
                answerLength: result.answer.length,
                sourcesFound: result.sources.length,
                processingTimeMs: result.metadata.processingTimeMs,
                success: true
            });

            return ResponseUtil.success(res, result, 'Query processed successfully');

        } catch (error) {
            LoggerUtil.logControllerError('CampaignQueryController', 'query', error, {
                campaignId: req.params?.campaignId,
                queryLength: req.body?.query?.length
            });

            if (error instanceof Error && error.message.includes('No embedding service available')) {
                return ResponseUtil.serviceUnavailable(res, 'AI service is temporarily unavailable');
            }

            if (error instanceof Error && error.message.includes('not running')) {
                return ResponseUtil.serviceUnavailable(res, 'Local AI service is not running. Please start Ollama service.');
            }

            return ResponseUtil.internalServerError(res, 'Failed to process query');
        }
    }

    /**
     * GET /api/campaigns/:campaignId/stats
     * Get knowledge base statistics for a campaign
     */
    async getStats(req: Request, res: Response): Promise<Response> {
        try {
            const { campaignId } = req.params;

            // Validate campaign ID
            if (!campaignId) {
                return ResponseUtil.badRequest(res, 'Campaign ID is required');
            }

            const parsedCampaignId = parseInt(campaignId, 10);
            if (!Number.isInteger(parsedCampaignId) || parsedCampaignId <= 0) {
                return ResponseUtil.badRequest(res, 'Invalid campaign ID');
            }

            LoggerUtil.logControllerOperation('CampaignQueryController', 'getStats', {
                campaignId: parsedCampaignId
            });

            const stats = await this.queryService.getCampaignStats(parsedCampaignId);

            LoggerUtil.logControllerOperation('CampaignQueryController', 'getStats - completed', {
                campaignId: parsedCampaignId,
                totalEmbeddings: stats.totalEmbeddings,
                totalFiles: stats.files.length,
                success: true
            });

            return ResponseUtil.success(res, stats, 'Campaign statistics retrieved successfully');

        } catch (error) {
            LoggerUtil.logControllerError('CampaignQueryController', 'getStats', error, {
                campaignId: req.params?.campaignId
            });

            return ResponseUtil.internalServerError(res, 'Failed to get campaign statistics');
        }
    }

    /**
     * GET /api/campaigns/service-status
     * Check if the query service is ready
     */
    async getServiceStatus(req: Request, res: Response): Promise<Response> {
        try {
            const isReady = await this.queryService.isServiceReady();
            
            const status = {
                ready: isReady,
                modelType: process.env.USE_LOCAL_MODEL === 'true' ? 'local-ollama' : 'gemini-api',
                timestamp: new Date().toISOString()
            };

            LoggerUtil.logControllerOperation('CampaignQueryController', 'getServiceStatus', {
                ready: isReady,
                modelType: status.modelType
            });

            if (isReady) {
                return ResponseUtil.success(res, status, 'Service is ready');
            } else {
                return ResponseUtil.serviceUnavailable(res, 'Service is not ready', status);
            }

        } catch (error) {
            LoggerUtil.logControllerError('CampaignQueryController', 'getServiceStatus', error);
            return ResponseUtil.internalServerError(res, 'Failed to check service status');
        }
    }
}