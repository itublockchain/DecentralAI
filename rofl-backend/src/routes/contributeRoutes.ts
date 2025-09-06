import { Router } from 'express';
import { contribute } from '../controllers/contributeController';
import { dynamicWalletAuth } from '../middlewares/dynamicAuth';

const router = Router();

router.post('/contribute', dynamicWalletAuth, contribute);

export { router as contributeRoutes };