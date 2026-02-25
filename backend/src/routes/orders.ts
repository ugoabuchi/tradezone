import { Router } from 'express';
import * as OrderController from '../controllers/OrderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, OrderController.createOrder);
router.get('/', authMiddleware, OrderController.getOrders);
router.delete('/:id', authMiddleware, OrderController.cancelOrder);
router.get('/book/:symbol', OrderController.getOrderBook);

export default router;
