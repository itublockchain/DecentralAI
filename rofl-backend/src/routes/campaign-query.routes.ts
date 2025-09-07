import { Router } from 'express';
import { CampaignQueryController } from '../controllers/campaign-query.controller';
import { JobController } from '../controllers/job.controller';
import { dynamicWalletAuth } from '../middlewares/dynamic-auth.middleware';

const router = Router();
const campaignQueryController = new CampaignQueryController();
const jobController = new JobController();

// Note: Authentication middleware can be added here when needed

/**
 * @route POST /api/campaigns/:campaignId/query
 * @desc Query a specific campaign's knowledge base using RAG
 * @access Private (requires authentication)
 * @body {
 *   query: string,           // The question to ask (required)
 *   topK?: number,           // Number of similar chunks to retrieve (1-20, default: 5)
 *   minSimilarity?: number   // Minimum similarity threshold (0-1, default: 0.1)
 * }
 * @response {
 *   answer: string,
 *   sources: Array<{
 *     chunkId: string,
 *     content: string,
 *     fileName: string,
 *     similarity: number,
 *     chunkIndex: number
 *   }>,
 *   metadata: {
 *     campaignId: number,
 *     totalSourcesFound: number,
 *     processingTimeMs: number,
 *     modelUsed: string
 *   }
 * }
 */
router.post('/:campaignId/query', dynamicWalletAuth, async (req, res) => {
    await campaignQueryController.query(req, res);
});

/**
 * @route GET /api/campaigns/:campaignId/stats
 * @desc Get knowledge base statistics for a campaign
 * @access Private (requires authentication)
 * @response {
 *   totalEmbeddings: number,
 *   totalChunks: number,
 *   avgVectorDimension: number,
 *   files: string[]
 * }
 */
router.get('/:campaignId/stats', async (req, res) => {
    await campaignQueryController.getStats(req, res);
});

/**
 * @route GET /api/campaigns/service-status
 * @desc Check if the query service is ready to handle requests
 * @access Private (requires authentication)
 * @response {
 *   ready: boolean,
 *   modelType: 'local-ollama' | 'gemini-api',
 *   timestamp: string
 * }
 */
router.get('/service-status', async (req, res) => {
    await campaignQueryController.getServiceStatus(req, res);
});

/**
 * @route GET /api/campaigns/:campaignId/jobs
 * @desc Get all jobs for a specific campaign
 * @access Private (requires authentication)
 * @response Array<{
 *   id: string,
 *   status: JobStatus,
 *   createdAt: Date,
 *   completedAt?: Date,
 *   progress: number,
 *   campaignId: number,
 *   fileName: string
 * }>
 */
router.get('/:campaignId/jobs', async (req, res) => {
    await jobController.getCampaignJobs(req, res);
});

export { router as campaignQueryRoutes };