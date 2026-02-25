/**
 * Paystack Payment Gateway Integration
 * Handles deposits and withdrawals via Paystack
 * Supports African currencies
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

const PAYSTACK_API_URL = 'https://api.paystack.co';

export class PaystackPaymentGateway extends PaymentGateway {
  private apiKey: string;
  private client: any;

  constructor(config: PaymentConfig) {
    super(config);
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL: PAYSTACK_API_URL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Process payment via Paystack
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validatePayment(request);

      const { fee, netAmount } = this.calculateFees(request.amount);

      if (request.type === 'deposit') {
        return await this.initializeTransaction(request, fee, netAmount);
      } else {
        return await this.initiateTransfer(request, fee, netAmount);
      }
    } catch (error: any) {
      console.error('Paystack payment error:', error);
      throw new Error(`Paystack payment failed: ${error.message}`);
    }
  }

  /**
   * Initialize Paystack transaction for deposits
   */
  private async initializeTransaction(
    request: PaymentRequest,
    fee: number,
    netAmount: number
  ): Promise<PaymentResponse> {
    try {
      const amountKobo = Math.round(request.amount * 100); // Convert to kobo (smallest unit)

      const response = await this.client.post('/transaction/initialize', {
        email: request.metadata?.email || '',
        amount: amountKobo,
        currency: request.currency,
        reference: `TZ-${Date.now()}-${request.userId}`,
        metadata: {
          userId: request.userId,
          type: 'deposit',
          ...request.metadata,
        },
        callback_url: `${request.returnUrl || process.env.FRONTEND_URL}/payment/success`,
      });

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      return {
        success: true,
        transactionId: response.data.data.reference,
        status: 'pending',
        amount: request.amount,
        fee,
        netAmount,
        currency: request.currency,
        gateway: 'paystack',
        checkoutUrl: response.data.data.authorization_url,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to initialize Paystack transaction: ${error.message}`);
    }
  }

  /**
   * Initiate Paystack transfer for withdrawals
   */
  private async initiateTransfer(
    request: PaymentRequest,
    fee: number,
    netAmount: number
  ): Promise<PaymentResponse> {
    try {
      const amountKobo = Math.round(request.amount * 100);

      // Get recipient code (from user profile)
      const recipientCode = request.metadata?.recipientCode;
      if (!recipientCode) {
        throw new Error('Recipient code required for withdrawal');
      }

      const response = await this.client.post('/transfer', {
        source: 'balance',
        amount: amountKobo,
        recipient: recipientCode,
        reason: `TradeZone Withdrawal - User ${request.userId}`,
        currency: request.currency,
      });

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      return {
        success: true,
        transactionId: response.data.data.reference,
        status: 'processing',
        amount: request.amount,
        fee,
        netAmount,
        currency: request.currency,
        gateway: 'paystack',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to initiate Paystack transfer: ${error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const response = await this.client.get(`/transaction/verify/${transactionId}`);

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      const transaction = response.data.data;

      const statusMap: { [key: string]: PaymentStatus['status'] } = {
        success: 'completed',
        pending: 'processing',
        failed: 'failed',
        abandoned: 'cancelled',
      };

      return {
        transactionId,
        status: statusMap[transaction.status] || 'pending',
        amount: transaction.amount / 100, // Convert from kobo
        currency: transaction.currency,
        gateway: 'paystack',
        lastUpdated: new Date().toISOString(),
        metadata: transaction.metadata,
      };
    } catch (error: any) {
      throw new Error(`Failed to check Paystack payment status: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const response = await this.client.post(`/refund`, {
        transaction: transactionId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      return {
        success: true,
        transactionId: response.data.data.refund.reference,
        status: 'completed',
        amount: amount || response.data.data.transaction.amount / 100,
        fee: 0,
        netAmount: amount || response.data.data.transaction.amount / 100,
        currency: response.data.data.transaction.currency,
        gateway: 'paystack',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to refund Paystack payment: ${error.message}`);
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhook(signature: string, payload: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha512', this.apiKey)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Paystack webhook validation error:', error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event: any): Promise<PaymentStatus> {
    try {
      const eventType = event.event;
      const data = event.data;

      if (
        eventType === 'charge.success' ||
        eventType === 'transfer.success'
      ) {
        return {
          transactionId: data.reference,
          status: 'completed',
          amount: data.amount / 100, // Convert from kobo
          currency: data.currency,
          gateway: 'paystack',
          lastUpdated: new Date().toISOString(),
        };
      } else if (eventType === 'charge.failed' || eventType === 'transfer.failed') {
        return {
          transactionId: data.reference,
          status: 'failed',
          amount: data.amount / 100,
          currency: data.currency,
          gateway: 'paystack',
          lastUpdated: new Date().toISOString(),
        };
      }

      return {
        transactionId: data.reference,
        status: 'pending',
        amount: data.amount / 100,
        currency: data.currency,
        gateway: 'paystack',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to handle Paystack webhook: ${error.message}`);
    }
  }

  /**
   * Create a recipient for transfers
   */
  async createRecipient(
    accountNumber: string,
    bankCode: string,
    name: string
  ): Promise<{ recipientCode: string }> {
    try {
      const response = await this.client.post('/transferrecipient', {
        type: 'nuban',
        name,
        account_number: accountNumber,
        bank_code: bankCode,
      });

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      return {
        recipientCode: response.data.data.recipient_code,
      };
    } catch (error: any) {
      throw new Error(`Failed to create Paystack recipient: ${error.message}`);
    }
  }

  /**
   * Get list of supported banks
   */
  async getBanks(): Promise<any[]> {
    try {
      const response = await this.client.get('/bank');

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      return response.data.data;
    } catch (error: any) {
      throw new Error(`Failed to get banks from Paystack: ${error.message}`);
    }
  }
}
