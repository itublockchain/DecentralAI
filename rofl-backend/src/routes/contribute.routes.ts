import { Router } from 'express';
import { contribute } from '../controllers/contribute.controller';
import { dynamicWalletAuth } from '../middlewares/dynamic-auth.middleware';

const router = Router();

router.post('/contribute', dynamicWalletAuth, contribute);

export { router as contributeRoutes };