/**
 * PayPal Payment Gateway Integration
 * Handles deposits and withdrawals via PayPal
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

const PAYPAL_SANDBOX_URL = 'https://api.sandbox.paypal.com';
const PAYPAL_LIVE_URL = 'https://api.paypal.com';

export class PayPalPaymentGateway extends PaymentGateway {
  private apiKey: string;
  private secretKey: string;
  private baseURL: string;
  private client: any;
  private accessToken: string = '';

  constructor(config: PaymentConfig) {
    super(config);
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey || '';
    this.baseURL = process.env.PAYPAL_MODE === 'live' ? PAYPAL_LIVE_URL : PAYPAL_SANDBOX_URL;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  /**
   * Get PayPal access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');

      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error: any) {
      throw new Error(`Failed to get PayPal access token: ${error.message}`);
    }
  }

  /**
   * Process payment via PayPal
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validatePayment(request);

      const { fee, netAmount } = this.calculateFees(request.amount);

      if (request.type === 'deposit') {
        return await this.createOrder(request, fee, netAmount);
      } else {
        return await this.createPayout(request, fee, netAmount);
      }
    } catch (error: any) {
      console.error('PayPal payment error:', error);
      throw new Error(`PayPal payment failed: ${error.message}`);
    }
  }

  /**
   * Create PayPal order for deposits
   */
  private async createOrder(
    request: PaymentRequest,
    fee: number,
    netAmount: number
  ): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.post(
        '/v2/checkout/orders',
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: request.userId,
              amount: {
                currency_code: request.currency,
                value: request.amount.toString(),
                breakdown: {
                  item_total: {
                    currency_code: request.currency,
                    value: netAmount.toString(),
                  },
                  tax_total: {
                    currency_code: request.currency,
                    value: '0',
                  },
                  shipping: {
                    currency_code: request.currency,
                    value: fee.toString(),
                  },
                },
              },
              items: [
                {
                  name: 'TradeZone Deposit',
                  quantity: '1',
                  category: 'DIGITAL_GOODS',
                  unit_amount: {
                    currency_code: request.currency,
                    value: netAmount.toString(),
                  },
                },
              ],
              shipping: {
                type: 'SHIPPING',
                name: {
                  full_name: 'Platform Fee',
                },
                amount: {
                  currency_code: request.currency,
                  value: fee.toString(),
                },
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: 'TradeZone',
                locale: 'en-US',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW',
                return_url: `${request.returnUrl || process.env.FRONTEND_URL}/payment/success`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
              },
            },
          },
          metadata: request.metadata,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const approvalLink = response.data.links.find((link: any) => link.rel === 'approve');

      return {
        success: true,
        transactionId: response.data.id,
        status: 'pending',
        amount: request.amount,
        fee,
        netAmount,
        currency: request.currency,
        gateway: 'paypal',
        checkoutUrl: approvalLink?.href,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create PayPal order: ${error.message}`);
    }
  }

  /**
   * Create PayPal payout for withdrawals
   */
  private async createPayout(
    request: PaymentRequest,
    fee: number,
    netAmount: number
  ): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.post(
        '/v1/payments/payouts',
        {
          sender_batch_header: {
            sender_batch_id: `batch-${Date.now()}`,
            email_subject: 'You have a payment from TradeZone',
            email_message: 'Thank you for using TradeZone',
          },
          items: [
            {
              recipient_type: 'EMAIL',
              amount: {
                value: netAmount.toString(),
                currency: request.currency,
              },
              description: 'TradeZone Withdrawal',
              sender_item_id: `item-${Date.now()}`,
              receiver: '', // Would come from user profile
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        transactionId: response.data.batch_header.payout_batch_id,
        status: 'processing',
        amount: request.amount,
        fee,
        netAmount,
        currency: request.currency,
        gateway: 'paypal',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create PayPal payout: ${error.message}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.get(`/v2/checkout/orders/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const statusMap: { [key: string]: PaymentStatus['status'] } = {
        CREATED: 'pending',
        SAVED: 'pending',
        APPROVED: 'processing',
        VOIDED: 'cancelled',
        COMPLETED: 'completed',
      };

      const purchaseUnit = response.data.purchase_units[0];

      return {
        transactionId,
        status: statusMap[response.data.status] || 'pending',
        amount: parseFloat(purchaseUnit.amount.value),
        currency: purchaseUnit.amount.currency_code,
        gateway: 'paypal',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to check PayPal payment status: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();

      // First, get the capture ID from the order
      const orderResponse = await this.client.get(`/v2/checkout/orders/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const captureId =
        orderResponse.data.purchase_units[0]?.payments?.captures[0]?.id;

      if (!captureId) {
        throw new Error('No capture found to refund');
      }

      const response = await this.client.post(
        `/v2/payments/captures/${captureId}/refund`,
        {
          amount: amount
            ? {
                value: amount.toString(),
                currency_code: orderResponse.data.purchase_units[0].amount.currency_code,
              }
            : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        transactionId: response.data.id,
        status: 'completed',
        amount: amount || parseFloat(orderResponse.data.purchase_units[0].amount.value),
        fee: 0,
        netAmount: amount || parseFloat(orderResponse.data.purchase_units[0].amount.value),
        currency: orderResponse.data.purchase_units[0].amount.currency_code,
        gateway: 'paypal',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to refund PayPal payment: ${error.message}`);
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhook(signature: string, payload: string): boolean {
    try {
      // PayPal uses different validation method
      // This is a simplified version - implement full validation based on PayPal docs
      const hash = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('PayPal webhook validation error:', error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event: any): Promise<PaymentStatus> {
    try {
      const eventType = event.event_type;
      const resource = event.resource;

      if (eventType === 'CHECKOUT.ORDER.COMPLETED') {
        return {
          transactionId: resource.id,
          status: 'completed',
          amount: parseFloat(resource.purchase_units[0].amount.value),
          currency: resource.purchase_units[0].amount.currency_code,
          gateway: 'paypal',
          lastUpdated: new Date().toISOString(),
        };
      }

      return {
        transactionId: resource.id,
        status: 'pending',
        amount: parseFloat(resource.purchase_units[0].amount.value),
        currency: resource.purchase_units[0].amount.currency_code,
        gateway: 'paypal',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to handle PayPal webhook: ${error.message}`);
    }
  }
}
