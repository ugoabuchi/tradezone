/**
 * Payment Gateway Service - Unified Payment Processing
 * Supports: Stripe, PayPal, Paystack, and more
 */

export interface PaymentConfig {
  gatewayId: string;
  name: string;
  enabled: boolean;
  apiKey: string;
  secretKey?: string;
  webhookUrl?: string;
  supportedCurrencies: string[];
  minAmount: number;
  maxAmount: number;
  feePercentage: number;
  fixedFee: number;
  processingTime: string; // e.g., "instant", "1-3 days"
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  gatewayId: string;
  type: 'deposit' | 'withdrawal';
  metadata?: Record<string, any>;
  returnUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  gateway: string;
  checkoutUrl?: string;
  timestamp: string;
  message?: string;
}

export interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  gateway: string;
  lastUpdated: string;
  metadata?: Record<string, any>;
}

/**
 * Base Payment Gateway Class
 * All gateway integrations inherit from this
 */
export abstract class PaymentGateway {
  protected config: PaymentConfig;
  protected name: string;

  constructor(config: PaymentConfig) {
    this.config = config;
    this.name = config.name;
  }

  /**
   * Validate payment request
   */
  protected validatePayment(request: PaymentRequest): void {
    if (!request.amount || request.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (request.amount < this.config.minAmount) {
      throw new Error(
        `Amount must be at least ${this.config.minAmount} ${request.currency}`
      );
    }

    if (request.amount > this.config.maxAmount) {
      throw new Error(
        `Amount cannot exceed ${this.config.maxAmount} ${request.currency}`
      );
    }

    if (!this.config.supportedCurrencies.includes(request.currency)) {
      throw new Error(
        `${this.name} does not support ${request.currency}. Supported: ${this.config.supportedCurrencies.join(', ')}`
      );
    }
  }

  /**
   * Calculate payment fees
   */
  protected calculateFees(amount: number): { fee: number; netAmount: number } {
    const percentageFee = (amount * this.config.feePercentage) / 100;
    const totalFee = percentageFee + this.config.fixedFee;
    const netAmount = amount - totalFee;

    return {
      fee: Math.round(totalFee * 100) / 100, // Round to 2 decimals
      netAmount: Math.round(netAmount * 100) / 100,
    };
  }

  /**
   * Process payment - must be implemented by subclasses
   */
  abstract processPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * Check payment status - must be implemented by subclasses
   */
  abstract checkPaymentStatus(transactionId: string): Promise<PaymentStatus>;

  /**
   * Initiate refund - must be implemented by subclasses
   */
  abstract refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse>;

  /**
   * Validate webhook signature
   */
  abstract validateWebhook(
    signature: string,
    payload: string
  ): boolean;

  /**
   * Handle webhook event
   */
  abstract handleWebhook(event: any): Promise<PaymentStatus>;

  /**
   * Get gateway status
   */
  getStatus(): {
    name: string;
    enabled: boolean;
    supportedCurrencies: string[];
    processingTime: string;
  } {
    return {
      name: this.name,
      enabled: this.config.enabled,
      supportedCurrencies: this.config.supportedCurrencies,
      processingTime: this.config.processingTime,
    };
  }
}

/**
 * Payment Gateway Factory
 * Creates and manages payment gateway instances
 */
export class PaymentGatewayFactory {
  private gateways: Map<string, PaymentGateway> = new Map();
  private configs: Map<string, PaymentConfig> = new Map();

  /**
   * Register a payment gateway
   */
  registerGateway(gateway: PaymentGateway, config: PaymentConfig): void {
    if (!config.enabled) {
      console.log(`⚠️  Payment gateway ${config.name} is disabled`);
      return;
    }

    this.gateways.set(config.gatewayId, gateway);
    this.configs.set(config.gatewayId, config);
    console.log(`✅ Payment gateway ${config.name} registered`);
  }

  /**
   * Get a specific gateway
   */
  getGateway(gatewayId: string): PaymentGateway | null {
    return this.gateways.get(gatewayId) || null;
  }

  /**
   * Get all registered gateways
   */
  getAllGateways(): PaymentGateway[] {
    return Array.from(this.gateways.values());
  }

  /**
   * Get gateway config
   */
  getConfig(gatewayId: string): PaymentConfig | null {
    return this.configs.get(gatewayId) || null;
  }

  /**
   * Get all gateway configs
   */
  getAllConfigs(): PaymentConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get enabled gateways
   */
  getEnabledGateways(): PaymentGateway[] {
    return this.getAllGateways().filter((g) => {
      const config = this.configs.get(
        Array.from(this.gateways.entries()).find(([_, v]) => v === g)?.[0] || ''
      );
      return config?.enabled;
    });
  }

  /**
   * Find gateways supporting a currency
   */
  getGatewaysByCurrency(currency: string): PaymentGateway[] {
    return this.getEnabledGateways().filter((gateway) => {
      const gatewayId = Array.from(this.gateways.entries()).find(([_, v]) => v === gateway)?.[0];
      const config = this.configs.get(gatewayId || '');
      return config?.supportedCurrencies.includes(currency);
    });
  }

  /**
   * Update gateway status
   */
  updateGatewayStatus(gatewayId: string, enabled: boolean): void {
    const config = this.configs.get(gatewayId);
    if (config) {
      config.enabled = enabled;
      if (enabled) {
        const gateway = this.gateways.get(gatewayId);
        if (gateway) {
          console.log(`✅ Payment gateway ${config.name} enabled`);
        }
      } else {
        console.log(`⚠️  Payment gateway ${config.name} disabled`);
      }
    }
  }

  /**
   * Update gateway configuration
   */
  updateGatewayConfig(gatewayId: string, config: Partial<PaymentConfig>): void {
    const existing = this.configs.get(gatewayId);
    if (existing) {
      Object.assign(existing, config);
      console.log(`✅ Payment gateway ${existing.name} configuration updated`);
    }
  }
}

/**
 * Global payment gateway factory instance
 */
export const paymentGatewayFactory = new PaymentGatewayFactory();
