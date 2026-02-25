import express from 'express';
import * as FuturesController from '../controllers/FuturesController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

router.use(verifyToken);

// Create and manage futures positions
router.post('/', FuturesController.createFuturesPosition);
router.get('/', FuturesController.getFuturesPositions);
router.put('/:positionId', FuturesController.updateFuturesPosition);
router.post('/:positionId/close', FuturesController.closeFuturesPosition);

// Futures metrics and stats
router.get('/metrics', FuturesController.getFuturesMetrics);

// Demo account
router.get('/demo/balance', FuturesController.getDemoAccountBalance);
router.post('/demo/reset', FuturesController.resetDemoAccount);

export default router;
