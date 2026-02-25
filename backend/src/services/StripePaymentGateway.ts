/**
 * Stripe Payment Gateway Integration
 * Handles deposits and withdrawals via Stripe
 */

import axios from 'axios';
import crypto from 'crypto';
import {
  PaymentGateway,
  PaymentConfig,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
} from './PaymentGatewayService';

const STRIPE_API_URL = 'https://api.stripe.com/v1';

export class StripePaymentGateway extends PaymentGateway {
  private apiKey: string;
  private client: any;

  constructor(config: PaymentConfig) {
    super(config);
    this.apiKey = config.apiKey;

    // Initialize Stripe API client
    this.client = axios.create({
      baseURL: STRIPE_API_URL,
      auth: {
        username: this.apiKey,
        password: '',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Process payment via Stripe
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validatePayment(request);

      const { fee, netAmount } = this.calculateFees(request.amount);
      const amountCents = Math.round(request.amount * 100);

      if (request.type === 'deposit') {
        return await this.createPaymentIntent(request, amountCents, fee, netAmount);
      } else {
        return await this.createPayout(request, amountCents, fee, netAmount);
      }
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  /**
   * Create Stripe Payment Intent for deposits
   */
  private async createPaymentIntent(
    request: PaymentRequest,
    amountCents: number,
    fee: number,
    netAmount: number
  ): Promise<PaymentResponse> {
    try {
      const response = await this.client.post('/payment_intents', {
        amount: amountCents,
        currency: request.currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata: {
          userId: request.userId,
          type: 'deposit',
          ...request.metadata,
        },
        description: `TradeZone Deposit - User ${request.userId}`,
      });

      return {
        success: true,
        transactionId: response.data.id,
        status: 'pending',
        amount: request.amount,
        fee,
        netAmount,
        currency: request.currency,
        gateway: 'stripe',
        checkoutUrl: `${process.env.FRONTEND_URL}/payment/stripe/${response.data.client_secret}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create Stripe payment intent: ${error.message}`);
    }
  }

  /**
   * Create Stripe Payout for withdrawals
   */
  private async createPayout(
    request: PaymentRequest,
    amountCents: number,
    fee: number,
    netAmount: number
  ): Promise<PaymentResponse> {
    try {
      // For withdrawals, we need connected account info
      // This would typically be stored in user profile
      const response = await this.client.post('/payouts', {
        amount: amountCents,
        currency: request.currency.toLowerCase(),
        description: `TradeZone Withdrawal - User ${request.userId}`,
        metadata: {
          userId: request.userId,
          type: 'withdrawal',
          ...request.metadata,
        },
      });

      return {
        success: true,
        transactionId: response.data.id,
        status: response.data.status as any,
        amount: request.amount,
        fee,
        netAmount,
        currency: request.currency,
        gateway: 'stripe',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create Stripe payout: ${error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const response = await this.client.get(`/payment_intents/${transactionId}`);

      const statusMap: { [key: string]: PaymentStatus['status'] } = {
        succeeded: 'completed',
        processing: 'processing',
        requires_payment_method: 'pending',
        requires_confirmation: 'pending',
        requires_action: 'pending',
        canceled: 'cancelled',
      };

      return {
        transactionId,
        status: statusMap[response.data.status] || 'pending',
        amount: response.data.amount / 100, // Convert cents to dollars
        currency: response.data.currency,
        gateway: 'stripe',
        lastUpdated: new Date().toISOString(),
        metadata: response.data.metadata,
      };
    } catch (error: any) {
      throw new Error(`Failed to check Stripe payment status: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const response = await this.client.post('/refunds', {
        payment_intent: transactionId,
        amount: amount ? Math.round(amount * 100) : undefined,
        metadata: {
          refundedAt: new Date().toISOString(),
        },
      });

      return {
        success: true,
        transactionId: response.data.id,
        status: response.data.status as any,
        amount: response.data.amount / 100,
        fee: 0,
        netAmount: response.data.amount / 100,
        currency: response.data.currency,
        gateway: 'stripe',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to refund Stripe payment: ${error.message}`);
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhook(signature: string, payload: string): boolean {
    try {
      const secretKey = this.config.secretKey;
      if (!secretKey) return false;

      const hash = crypto
        .createHmac('sha256', secretKey)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Webhook validation error:', error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event: any): Promise<PaymentStatus> {
    try {
      const eventType = event.type;
      const paymentIntent = event.data.object;

      if (
        eventType === 'payment_intent.succeeded' ||
        eventType === 'charge.succeeded'
      ) {
        return {
          transactionId: paymentIntent.id,
          status: 'completed',
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          gateway: 'stripe',
          lastUpdated: new Date().toISOString(),
        };
      }

      return {
        transactionId: paymentIntent.id,
        status: 'pending',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        gateway: 'stripe',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to handle Stripe webhook: ${error.message}`);
    }
  }
}
