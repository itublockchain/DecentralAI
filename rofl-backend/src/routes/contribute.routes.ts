import { Router } from 'express';
import { contribute } from '../controllers/contribute.controller';
import { dynamicWalletAuth } from '../middlewares/dynamic-auth.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();

router.post('/contribute', dynamicWalletAuth, uploadSingle, contribute);

export { router as contributeRoutes };