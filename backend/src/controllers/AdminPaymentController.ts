/**
 * Admin Payment Configuration Controller
 * Manage payment gateways and configurations
 */

import { Request, Response } from 'express';
import { paymentGatewayFactory } from '../services/PaymentGatewayService';

/**
 * Get all payment gateway configurations
 */
export const getAllGatewayConfigs = async (req: Request, res: Response): Promise<void> => {
  try {
    const configs = paymentGatewayFactory.getAllConfigs();

    const gatewayConfigs = configs.map((config) => ({
      id: config.gatewayId,
      name: config.name,
      enabled: config.enabled,
      supportedCurrencies: config.supportedCurrencies,
      minAmount: config.minAmount,
      maxAmount: config.maxAmount,
      feePercentage: config.feePercentage,
      fixedFee: config.fixedFee,
      processingTime: config.processingTime,
      // Don't return API keys in response
    }));

    res.json({
      success: true,
      count: gatewayConfigs.length,
      gateways: gatewayConfigs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gateway configurations',
      error: error.message,
    });
  }
};

/**
 * Get specific gateway configuration
 */
export const getGatewayConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;

    const config = paymentGatewayFactory.getConfig(gatewayId);
    if (!config) {
      res.status(404).json({
        success: false,
        message: `Gateway ${gatewayId} not found`,
      });
      return;
    }

    res.json({
      success: true,
      gateway: {
        id: config.gatewayId,
        name: config.name,
        enabled: config.enabled,
        supportedCurrencies: config.supportedCurrencies,
        minAmount: config.minAmount,
        maxAmount: config.maxAmount,
        feePercentage: config.feePercentage,
        fixedFee: config.fixedFee,
        processingTime: config.processingTime,
        webhookUrl: config.webhookUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gateway configuration',
      error: error.message,
    });
  }
};

/**
 * Update gateway configuration
 */
export const updateGatewayConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;
    const { enabled, minAmount, maxAmount, feePercentage, fixedFee, apiKey, secretKey, webhookUrl } = req.body;

    const config = paymentGatewayFactory.getConfig(gatewayId);
    if (!config) {
      res.status(404).json({
        success: false,
        message: `Gateway ${gatewayId} not found`,
      });
      return;
    }

    // Update configuration
    const updates: any = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (minAmount !== undefined) updates.minAmount = minAmount;
    if (maxAmount !== undefined) updates.maxAmount = maxAmount;
    if (feePercentage !== undefined) updates.feePercentage = feePercentage;
    if (fixedFee !== undefined) updates.fixedFee = fixedFee;
    if (apiKey !== undefined) updates.apiKey = apiKey;
    if (secretKey !== undefined) updates.secretKey = secretKey;
    if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl;

    paymentGatewayFactory.updateGatewayConfig(gatewayId, updates);

    const updatedConfig = paymentGatewayFactory.getConfig(gatewayId);

    res.json({
      success: true,
      message: `Gateway ${gatewayId} configuration updated`,
      gateway: {
        id: updatedConfig?.gatewayId,
        name: updatedConfig?.name,
        enabled: updatedConfig?.enabled,
        minAmount: updatedConfig?.minAmount,
        maxAmount: updatedConfig?.maxAmount,
        feePercentage: updatedConfig?.feePercentage,
        fixedFee: updatedConfig?.fixedFee,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to update gateway configuration',
      error: error.message,
    });
  }
};

/**
 * Enable/Disable payment gateway
 */
export const toggleGatewayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;
    const { enabled } = req.body;

    if (enabled === undefined) {
      res.status(400).json({
        success: false,
        message: 'enabled parameter is required',
      });
      return;
    }

    const config = paymentGatewayFactory.getConfig(gatewayId);
    if (!config) {
      res.status(404).json({
        success: false,
        message: `Gateway ${gatewayId} not found`,
      });
      return;
    }

    paymentGatewayFactory.updateGatewayStatus(gatewayId, enabled);

    res.json({
      success: true,
      message: `Gateway ${gatewayId} ${enabled ? 'enabled' : 'disabled'}`,
      gateway: {
        id: gatewayId,
        enabled,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Failed to update gateway status',
      error: error.message,
    });
  }
};

/**
 * Get gateway statistics
 */
export const getGatewayStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;
    const { days = 30 } = req.query;

    const config = paymentGatewayFactory.getConfig(gatewayId);
    if (!config) {
      res.status(404).json({
        success: false,
        message: `Gateway ${gatewayId} not found`,
      });
      return;
    }

    const PaymentService = await import('../services/PaymentService');
    const volume = await PaymentService.getGatewayVolume(gatewayId, parseInt(days as string));
    const transactionCount = await PaymentService.getGatewayTransactionCount(
      gatewayId,
      parseInt(days as string)
    );

    res.json({
      success: true,
      gateway: gatewayId,
      period: `${days} days`,
      stats: {
        totalVolume: volume.total,
        totalTransactions: volume.count,
        averageTransaction: volume.count > 0 ? volume.total / volume.count : 0,
        transactionCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gateway statistics',
      error: error.message,
    });
  }
};

/**
 * Get all gateway statistics
 */
export const getAllGatewayStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const PaymentService = await import('../services/PaymentService');

    const configs = paymentGatewayFactory.getAllConfigs();
    const stats = await Promise.all(
      configs.map(async (config) => {
        const volume = await PaymentService.getGatewayVolume(config.gatewayId, parseInt(days as string));
        return {
          gateway: config.name,
          enabled: config.enabled,
          totalVolume: volume.total,
          totalTransactions: volume.count,
          averageTransaction: volume.count > 0 ? volume.total / volume.count : 0,
        };
      })
    );

    res.json({
      success: true,
      period: `${days} days`,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gateway statistics',
      error: error.message,
    });
  }
};

/**
 * Get fee summary
 */
export const getFeeSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const configs = paymentGatewayFactory.getAllConfigs();

    const summary = configs.map((config) => ({
      gateway: config.name,
      enabled: config.enabled,
      feePercentage: config.feePercentage,
      fixedFee: config.fixedFee,
      totalFee: (amount: number) => {
        const percentage = (amount * config.feePercentage) / 100;
        return Math.round((percentage + config.fixedFee) * 100) / 100;
      },
    }));

    res.json({
      success: true,
      count: summary.length,
      summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee summary',
      error: error.message,
    });
  }
};

/**
 * Test gateway connection
 */
export const testGatewayConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;

    const config = paymentGatewayFactory.getConfig(gatewayId);
    if (!config) {
      res.status(404).json({
        success: false,
        message: `Gateway ${gatewayId} not found`,
      });
      return;
    }

    const gateway = paymentGatewayFactory.getGateway(gatewayId);
    if (!gateway) {
      res.status(400).json({
        success: false,
        message: `Gateway ${gatewayId} is not enabled`,
      });
      return;
    }

    // Get gateway status
    const status = gateway.getStatus();

    res.json({
      success: true,
      message: 'Gateway connection test passed',
      gateway: status,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Gateway connection test failed',
      error: error.message,
    });
  }
};
