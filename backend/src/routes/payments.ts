/**
 * Payment Routes
 * User payment operations
 */

import { Router, Request, Response } from 'express';
import * as PaymentController from '../controllers/PaymentController';
import { authenticate } from '../middleware/auth';
import {
  handleStripeWebhook,
  handlePayPalWebhook,
  handlePaystackWebhook,
} from '../webhook/paymentWebhooks';

const router = Router();

// Webhook endpoints don't require authentication (they must verify via signature)
/**
 * POST /api/payments/webhook/stripe
 * Stripe webhook endpoint
 */
router.post('/webhook/stripe', (req: Request, res: Response) =>
  handleStripeWebhook(req, res)
);

/**
 * POST /api/payments/webhook/paypal
 * PayPal webhook endpoint
 */
router.post('/webhook/paypal', (req: Request, res: Response) =>
  handlePayPalWebhook(req, res)
);

/**
 * POST /api/payments/webhook/paystack
 * Paystack webhook endpoint
 */
router.post('/webhook/paystack', (req: Request, res: Response) =>
  handlePaystackWebhook(req, res)
);

// All other routes require authentication
router.use(authenticate);

/**
 * GET /api/payments/gateways
 * Get all available payment gateways
 */
router.get('/gateways', PaymentController.getAvailableGateways);

/**
 * GET /api/payments/gateways/:currency
 * Get payment gateways by currency
 */
router.get('/gateways/:currency', PaymentController.getGatewaysByCurrency);

/**
 * POST /api/payments/initiate
 * Initiate a payment (deposit or withdrawal)
 */
router.post('/initiate', PaymentController.initiatePayment);

/**
 * GET /api/payments/:transactionId/status
 * Check payment status
 */
router.get('/:transactionId/status', PaymentController.checkPaymentStatus);

/**
 * POST /api/payments/:transactionId/refund
 * Refund a payment
 */
router.post('/:transactionId/refund', PaymentController.refundPayment);

/**
 * GET /api/payments/history
 * Get user payment history
 */
router.get('/history', PaymentController.getPaymentHistory);
