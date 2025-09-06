import { Router } from 'express';
import { JobController } from '../controllers/job.controller';

const router = Router();
const jobController = new JobController();

/**
 * @route GET /api/jobs/:jobId
 * @desc Get job status by ID
 * @access Public (no auth needed for job status)
 * @response {
 *   id: string,
 *   status: 'queued' | 'processing' | 'completed' | 'failed',
 *   createdAt: Date,
 *   startedAt?: Date,
 *   completedAt?: Date,
 *   error?: string,
 *   progress: number,
 *   campaignId: number,
 *   fileName: string
 * }
 */
router.get('/:jobId', async (req, res) => {
    await jobController.getJobStatus(req, res);
});

/**
 * @route GET /api/jobs/stats
 * @desc Get queue statistics
 * @access Public
 * @response {
 *   queued: number,
 *   processing: number,
 *   completed: number,
 *   failed: number,
 *   totalJobs: number
 * }
 */
router.get('/stats', async (req, res) => {
    await jobController.getQueueStats(req, res);
});

export { router as jobRoutes };