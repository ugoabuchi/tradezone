import express from 'express';
import * as CopyTradingController from '../controllers/CopyTradingController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/search', CopyTradingController.searchLeaders);
router.get('/trader/:userId/stats', CopyTradingController.getTraderStats);

// Protected routes
router.use(verifyToken);

router.post('/follow', CopyTradingController.followTrader);
router.post('/unfollow', CopyTradingController.unfollowTrader);
router.get('/following', CopyTradingController.getFollowingList);
router.get('/followers', CopyTradingController.getFollowers);
router.post('/pause', CopyTradingController.pauseCopyTrade);
router.post('/resume', CopyTradingController.resumeCopyTrade);

export default router;
