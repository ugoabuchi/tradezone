/**
 * Admin Payment Routes
 * Payment gateway configuration and management
 */

import { Router } from 'express';
import * as AdminPaymentController from '../controllers/AdminPaymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Middleware to require authentication and admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if ((req.user?.role || 'user') !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/payments/gateways
 * Get all payment gateway configurations
 */
router.get('/gateways', AdminPaymentController.getAllGatewayConfigs);

/**
 * GET /api/admin/payments/gateways/:gatewayId
 * Get specific gateway configuration
 */
router.get('/gateways/:gatewayId', AdminPaymentController.getGatewayConfig);

/**
 * PUT /api/admin/payments/gateways/:gatewayId
 * Update gateway configuration
 */
router.put('/gateways/:gatewayId', AdminPaymentController.updateGatewayConfig);

/**
 * PATCH /api/admin/payments/gateways/:gatewayId/toggle
 * Enable/Disable payment gateway
 */
router.patch('/gateways/:gatewayId/toggle', AdminPaymentController.toggleGatewayStatus);

/**
 * GET /api/admin/payments/gateways/:gatewayId/stats
 * Get gateway statistics
 */
router.get('/gateways/:gatewayId/stats', AdminPaymentController.getGatewayStats);

/**
 * GET /api/admin/payments/stats
 * Get all gateway statistics
 */
router.get('/stats', AdminPaymentController.getAllGatewayStats);

/**
 * GET /api/admin/payments/fees
 * Get fee summary for all gateways
 */
router.get('/fees', AdminPaymentController.getFeeSummary);

/**
 * POST /api/admin/payments/gateways/:gatewayId/test
 * Test gateway connection
 */
router.post('/gateways/:gatewayId/test', AdminPaymentController.testGatewayConnection);

export default router;
