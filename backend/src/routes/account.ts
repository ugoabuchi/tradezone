import { Router } from 'express';
import * as AccountController from '../controllers/AccountController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/balance', authMiddleware, AccountController.getBalance);
router.get('/portfolio', authMiddleware, AccountController.getPortfolio);
router.get('/transactions', authMiddleware, AccountController.getTransactions);

export default router;
