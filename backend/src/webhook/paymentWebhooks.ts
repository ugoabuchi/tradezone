import { Request, Response } from 'express';
import crypto from 'crypto';
import { paymentGatewayFactory } from '../services/PaymentGatewayService';
import { PaymentService } from '../services/PaymentService';
import pool from '../config/database';

const paymentService = new PaymentService(pool);

/**
 * Stripe Webhook Handler
 * Validates Stripe webhook signatures and updates payment status
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Verify webhook signature
    const event = verifyStripeSignature(req.body, sig, webhookSecret);

    console.log(`Received Stripe webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleStripeRefund(event.data.object);
        break;

      case 'payout.paid':
        await handleStripePayout(event.data.object);
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error.message);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
}

/**
 * PayPal Webhook Handler
 * Validates PayPal webhook signatures and updates payment status
 */
export async function handlePayPalWebhook(req: Request, res: Response) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const webhookSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!webhookId || !webhookSecret) {
      console.error('PayPal webhook not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const event = req.body;

    console.log(`Received PayPal webhook event: ${event.event_type}`);

    // Verify webhook signature
    const isValid = await verifyPayPalSignature(req, webhookId);
    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Handle different event types
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.COMPLETED':
        await handlePayPalOrderCompleted(event.resource);
        break;

      case 'CHECKOUT.ORDER.APPROVED':
        await handlePayPalOrderApproved(event.resource);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await handlePayPalSaleCompleted(event.resource);
        break;

      case 'PAYMENT.SALE.REFUNDED':
        await handlePayPalSaleRefunded(event.resource);
        break;

      case 'INVOICING.PAYMENT-RECEIVED':
        await handlePayPalPaymentReceived(event.resource);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    res.json({ status: 'success' });
  } catch (error: any) {
    console.error('PayPal webhook error:', error.message);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
}

/**
 * Paystack Webhook Handler
 * Validates Paystack webhook signatures and updates payment status
 */
export async function handlePaystackWebhook(req: Request, res: Response) {
  try {
    const hash = req.headers['x-paystack-signature'] as string;
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Paystack webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Verify webhook signature
    const isValid = verifyPaystackSignature(req.body, hash, webhookSecret);
    if (!isValid) {
      console.error('Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log(`Received Paystack webhook event: ${event.event}`);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handlePaystackChargeSuccess(event.data);
        break;

      case 'charge.failed':
        await handlePaystackChargeFailed(event.data);
        break;

      case 'transfer.success':
        await handlePaystackTransferSuccess(event.data);
        break;

      case 'transfer.failed':
        await handlePaystackTransferFailed(event.data);
        break;

      case 'transfer.reversed':
        await handlePaystackTransferReversed(event.data);
        break;

      default:
        console.log(`Unhandled Paystack event: ${event.event}`);
    }

    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Paystack webhook error:', error.message);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
}

// ============ STRIPE HANDLERS ============

function verifyStripeSignature(body: any, sig: string, secret: string) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const [timestamp, signature] = sig.split(',')[1].split('=').slice(-1)[0];

  if (signature !== computedSignature) {
    throw new Error('Invalid Stripe signature');
  }

  return JSON.parse(payload);
}

async function handleStripePaymentSuccess(paymentIntent: any) {
  try {
    const transactionId = paymentIntent.id;
    const metadata = paymentIntent.metadata || {};

    await paymentService.updatePaymentStatus(transactionId, 'completed', {
      stripePaymentIntentId: paymentIntent.id,
      stripeStatus: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    });

    console.log(`✓ Stripe payment ${transactionId} marked as completed`);
  } catch (error: any) {
    console.error('Error handling Stripe payment success:', error.message);
  }
}

async function handleStripePaymentFailed(paymentIntent: any) {
  try {
    const transactionId = paymentIntent.id;

    await paymentService.updatePaymentStatus(transactionId, 'failed', {
      stripeStatus: paymentIntent.status,
      error: paymentIntent.last_payment_error?.message,
    });

    console.log(`✗ Stripe payment ${transactionId} marked as failed`);
  } catch (error: any) {
    console.error('Error handling Stripe payment failure:', error.message);
  }
}

async function handleStripeRefund(charge: any) {
  try {
    // Find payment by charge ID
    const payment = await paymentService.getPaymentByReference(charge.refunds.data[0].id);

    if (payment) {
      await paymentService.updatePaymentStatus(payment.transaction_id, 'refunded', {
        refundId: charge.refunds.data[0].id,
        refundAmount: charge.refunds.data[0].amount / 100,
      });

      console.log(`✓ Stripe refund processed for payment ${payment.transaction_id}`);
    }
  } catch (error: any) {
    console.error('Error handling Stripe refund:', error.message);
  }
}

async function handleStripePayout(payout: any) {
  try {
    console.log(`Stripe payout ${payout.id} status: ${payout.status}`);
  } catch (error: any) {
    console.error('Error handling Stripe payout:', error.message);
  }
}

// ============ PAYPAL HANDLERS ============

async function verifyPayPalSignature(req: Request, webhookId: string): Promise<boolean> {
  try {
    const body = req.body;
    const headers = req.headers;

    // Construct verification string
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const cert = headers['paypal-cert-url'];
    const authAlgo = headers['paypal-auth-algo'];
    const signature = headers['paypal-transmission-sig'];

    const expectedSignature = crypto
      .createHash('sha256')
      .update(
        `${transmissionId}|${transmissionTime}|${webhookId}|${JSON.stringify(body)}`
      )
      .digest('base64');

    return expectedSignature === signature;
  } catch (error) {
    console.error('PayPal signature verification error:', error);
    return false;
  }
}

async function handlePayPalOrderCompleted(order: any) {
  try {
    const transactionId = order.id;

    await paymentService.updatePaymentStatus(transactionId, 'completed', {
      paypalOrderId: order.id,
      paypalStatus: order.status,
      purchaseUnits: order.purchase_units,
    });

    console.log(`✓ PayPal order ${transactionId} marked as completed`);
  } catch (error: any) {
    console.error('Error handling PayPal order completion:', error.message);
  }
}

async function handlePayPalOrderApproved(order: any) {
  try {
    const transactionId = order.id;

    await paymentService.updatePaymentStatus(transactionId, 'processing', {
      paypalOrderId: order.id,
      paypalStatus: order.status,
    });

    console.log(`✓ PayPal order ${transactionId} marked as processing`);
  } catch (error: any) {
    console.error('Error handling PayPal order approval:', error.message);
  }
}

async function handlePayPalSaleCompleted(sale: any) {
  try {
    await paymentService.updatePaymentStatus(sale.id, 'completed', {
      paypalSaleId: sale.id,
      paypalStatus: sale.state,
    });

    console.log(`✓ PayPal sale ${sale.id} marked as completed`);
  } catch (error: any) {
    console.error('Error handling PayPal sale completion:', error.message);
  }
}

async function handlePayPalSaleRefunded(sale: any) {
  try {
    const payment = await paymentService.getPaymentByReference(sale.id);

    if (payment) {
      await paymentService.updatePaymentStatus(payment.transaction_id, 'refunded', {
        paypalSaleId: sale.id,
        refundedAmount: sale.amount.total,
      });

      console.log(`✓ PayPal refund processed for sale ${sale.id}`);
    }
  } catch (error: any) {
    console.error('Error handling PayPal refund:', error.message);
  }
}

async function handlePayPalPaymentReceived(payment: any) {
  try {
    console.log(`PayPal payment received: ${payment.id}`);
  } catch (error: any) {
    console.error('Error handling PayPal payment received:', error.message);
  }
}

// ============ PAYSTACK HANDLERS ============

function verifyPaystackSignature(body: any, hash: string, secret: string): boolean {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  const expectedHash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');

  return hash === expectedHash;
}

async function handlePaystackChargeSuccess(data: any) {
  try {
    const transactionId = data.reference || data.id.toString();

    await paymentService.updatePaymentStatus(transactionId, 'completed', {
      paystackTransactionId: data.id,
      paystackReference: data.reference,
      paystackStatus: data.status,
      amount: data.amount / 100,
      currency: data.currency,
    });

    console.log(`✓ Paystack charge ${transactionId} marked as completed`);
  } catch (error: any) {
    console.error('Error handling Paystack charge success:', error.message);
  }
}

async function handlePaystackChargeFailed(data: any) {
  try {
    const transactionId = data.reference || data.id.toString();

    await paymentService.updatePaymentStatus(transactionId, 'failed', {
      paystackTransactionId: data.id,
      paystackStatus: data.status,
      error: data.gateway_response,
    });

    console.log(`✗ Paystack charge ${transactionId} marked as failed`);
  } catch (error: any) {
    console.error('Error handling Paystack charge failure:', error.message);
  }
}

async function handlePaystackTransferSuccess(data: any) {
  try {
    const transactionId = data.reference || data.id.toString();

    await paymentService.updatePaymentStatus(transactionId, 'completed', {
      paystackTransferId: data.id,
      paystackTransferStatus: data.status,
      recipient: data.recipient,
      amount: data.amount / 100,
    });

    console.log(`✓ Paystack transfer ${transactionId} marked as completed`);
  } catch (error: any) {
    console.error('Error handling Paystack transfer success:', error.message);
  }
}

async function handlePaystackTransferFailed(data: any) {
  try {
    const transactionId = data.reference || data.id.toString();

    await paymentService.updatePaymentStatus(transactionId, 'failed', {
      paystackTransferId: data.id,
      paystackTransferStatus: data.status,
      error: data.reason,
    });

    console.log(`✗ Paystack transfer ${transactionId} marked as failed`);
  } catch (error: any) {
    console.error('Error handling Paystack transfer failure:', error.message);
  }
}

async function handlePaystackTransferReversed(data: any) {
  try {
    const transactionId = data.reference || data.id.toString();

    await paymentService.updatePaymentStatus(transactionId, 'refunded', {
      paystackTransferId: data.id,
      reversedAt: new Date().toISOString(),
    });

    console.log(`✓ Paystack transfer ${transactionId} marked as reversed`);
  } catch (error: any) {
    console.error('Error handling Paystack transfer reversal:', error.message);
  }
}

export default {
  handleStripeWebhook,
  handlePayPalWebhook,
  handlePaystackWebhook,
};
