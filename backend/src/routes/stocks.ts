import express from 'express';
import * as StockController from '../controllers/StockController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/price/:symbol', StockController.getStockPrice);
router.get('/profile/:symbol', StockController.getStockProfile);

// Protected routes
router.use(verifyToken);

router.post('/buy', StockController.buyStock);
router.post('/sell', StockController.sellStock);
router.get('/positions', StockController.getStockPositions);
router.get('/metrics', StockController.getStockMetrics);

export default router;
