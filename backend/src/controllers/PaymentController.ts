/**
 * Payment Controller
 * Handles payment-related requests
 */

import { Request, Response } from 'express';
import { paymentGatewayFactory } from '../services/PaymentGatewayService';
import * as PaymentService from '../services/PaymentService';
import { query } from '../config/database';

/**
 * Get available payment gateways
 */
export const getAvailableGateways = async (req: Request, res: Response): Promise<void> => {
  try {
    const gateways = paymentGatewayFactory.getEnabledGateways();
    const configs = gateways.map((gateway) => {
      const gatewayId = Object.entries(paymentGatewayFactory['gateways'] || {})
        .find(([_, g]) => g === gateway)?.[0];
      const config = paymentGatewayFactory.getConfig(gatewayId || '');
      return {
        id: gatewayId,
        name: config?.name,
        supportedCurrencies: config?.supportedCurrencies,
        minAmount: config?.minAmount,
        maxAmount: config?.maxAmount,
        feePercentage: config?.feePercentage,
        fixedFee: config?.fixedFee,
        processingTime: config?.processingTime,
      };
    });

    res.json({
      success: true,
      count: configs.length,
      gateways: configs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment gateways',
      error: error.message,
    });
  }
};

/**
 * Get gateways by currency
 */
export const getGatewaysByCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currency } = req.params;

    if (!currency) {
      res.status(400).json({
        success: false,
        message: 'Currency parameter is required',
      });
      return;
    }

    const gateways = paymentGatewayFactory.getGatewaysByCurrency(currency.toUpperCase());
    const configs = gateways.map((gateway) => {
      const gatewayId = Object.entries(paymentGatewayFactory['gateways'] || {})
        .find(([_, g]) => g === gateway)?.[0];
      const config = paymentGatewayFactory.getConfig(gatewayId || '');
      return {
        id: gatewayId,
        name: config?.name,
        processingTime: config?.processingTime,
        feePercentage: config?.feePercentage,
      };
    });

    res.json({
      success: true,
      currency,
      count: configs.length,
      gateways: configs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gateways for currency',
      error: error.message,
    });
  }
};

/**
 * Initiate payment (deposit/withdrawal)
 */
export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency, gatewayId, type, metadata, returnUrl } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!amount || !currency || !gatewayId || !type) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, currency, gatewayId, type',
      });
      return;
    }

    const gateway = paymentGatewayFactory.getGateway(gatewayId);
    if (!gateway) {
      res.status(400).json({
        success: false,
        message: `Payment gateway ${gatewayId} not found or not enabled`,
      });
      return;
    }

    // Process payment
    const paymentResult = await gateway.processPayment({
      userId,
      amount,
      currency: currency.toUpperCase(),
      gatewayId,
      type,
      metadata,
      returnUrl,
    });

    // Store payment record
    await PaymentService.createPaymentRecord({
      userId,
      transactionId: paymentResult.transactionId,
      gateway: gatewayId,
      amount,
      fee: paymentResult.fee,
      netAmount: paymentResult.netAmount,
      currency: currency.toUpperCase(),
      type,
      status: paymentResult.status,
      metadata: JSON.stringify(metadata || {}),
    });

    res.json({
      success: true,
      payment: paymentResult,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} initiated successfully`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message,
    });
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { gatewayId } = req.query;

    if (!transactionId || !gatewayId) {
      res.status(400).json({
        success: false,
        message: 'Transaction ID and gateway ID are required',
      });
      return;
    }

    // Get payment record
    const paymentRecord = await PaymentService.getPaymentRecord(transactionId as string);
    if (!paymentRecord) {
      res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
      return;
    }

    // Check status with gateway
    const gateway = paymentGatewayFactory.getGateway(gatewayId as string);
    if (!gateway) {
      res.status(400).json({
        success: false,
        message: 'Invalid gateway',
      });
      return;
    }

    const status = await gateway.checkPaymentStatus(transactionId as string);

    // Update payment record if status changed
    if (status.status !== paymentRecord.status) {
      await PaymentService.updatePaymentStatus(transactionId as string, status.status);
    }

    res.json({
      success: true,
      payment: {
        transactionId: status.transactionId,
        status: status.status,
        amount: status.amount,
        currency: status.currency,
        gateway: status.gateway,
        lastUpdated: status.lastUpdated,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message,
    });
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { amount, gatewayId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!transactionId || !gatewayId) {
      res.status(400).json({
        success: false,
        message: 'Transaction ID and gateway ID are required',
      });
      return;
    }

    // Verify ownership
    const paymentRecord = await PaymentService.getPaymentRecord(transactionId);
    if (!paymentRecord || paymentRecord.user_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Process refund
    const gateway = paymentGatewayFactory.getGateway(gatewayId);
    if (!gateway) {
      res.status(400).json({
        success: false,
        message: 'Invalid gateway',
      });
      return;
    }

    const refundResult = await gateway.refundPayment(transactionId, amount);

    // Update payment record
    await PaymentService.updatePaymentStatus(transactionId, 'refunded');
    await PaymentService.createRefundRecord({
      paymentId: transactionId,
      amount: refundResult.amount,
      status: refundResult.status,
    });

    res.json({
      success: true,
      refund: refundResult,
      message: 'Refund processed successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to refund payment',
      error: error.message,
    });
  }
};

/**
 * Get user payment history
 */
export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { limit = 10, offset = 0, type, status } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const payments = await PaymentService.getUserPaymentHistory(
      userId,
      {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        type: type as string,
        status: status as string,
      }
    );

    res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
    });
  }
};

/**
 * Handle webhook (from payment gateway)
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;
    const signature = req.headers['x-signature'] as string;
    const payload = JSON.stringify(req.body);

    const gateway = paymentGatewayFactory.getGateway(gatewayId);
    if (!gateway) {
      res.status(400).json({
        success: false,
        message: 'Invalid gateway',
      });
      return;
    }

    // Validate webhook
    if (!gateway.validateWebhook(signature, payload)) {
      res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
      });
      return;
    }

    // Handle webhook event
    const paymentStatus = await gateway.handleWebhook(req.body);

    // Update payment record
    await PaymentService.updatePaymentStatus(paymentStatus.transactionId, paymentStatus.status);

    // TODO: Trigger notifications, update wallets, etc.

    res.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message,
    });
  }
};
