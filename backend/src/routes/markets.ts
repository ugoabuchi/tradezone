import { Router } from 'express';
import * as MarketController from '../controllers/MarketController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, MarketController.getMarkets);
router.get('/forex/pairs', optionalAuth, MarketController.getForexPairs);
router.get('/:id', optionalAuth, MarketController.getMarketById);

export default router;
