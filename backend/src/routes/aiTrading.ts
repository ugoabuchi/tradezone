import express from 'express';
import * as AITradingController from '../controllers/AITradingController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

router.use(verifyToken);

// Bot management
router.post('/', AITradingController.createAIBot);
router.get('/', AITradingController.getUserAIBots);
router.post('/:botId/activate', AITradingController.activateAIBot);
router.post('/:botId/deactivate', AITradingController.deactivateAIBot);
router.post('/:botId/pause', AITradingController.pauseAIBot);
router.delete('/:botId', AITradingController.deleteAIBot);

// Performance and analytics
router.get('/:botId/performance', AITradingController.getAIBotPerformance);

// Execute trades
router.post('/run', AITradingController.runAutomatedTrading);

export default router;
