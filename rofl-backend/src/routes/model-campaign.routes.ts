import { Router } from 'express';
import { ModelCampaignController } from '../controllers/model-campaign.controller';
import { dynamicWalletAuth } from '../middlewares/dynamic-auth.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = Router();
const modelCampaignController = new ModelCampaignController();

router.post('/', dynamicWalletAuth, uploadSingle, (req, res) => {
    modelCampaignController.createModelCampaign(req, res);
});

router.get('/:campaignId', (req, res) => {
    modelCampaignController.getCampaignDetails(req, res);
});

router.get('/total/count', (req, res) => {
    modelCampaignController.getTotalCampaigns(req, res);
});

export { router as modelCampaignRoutes };