# Payment Gateway Integration Guide

## Overview

TradeZone now supports multiple payment gateways for fiat deposits and withdrawals. Users can deposit and withdraw traditional currencies (USD, EUR, GBP, etc.) using their preferred payment method.

**Supported Gateways:**
- ✅ **Stripe** - Global payment processing (cards, ACH transfers)
- ✅ **PayPal** - International payments and transfers
- ✅ **Paystack** - African payments (NGN, GHS, ZAR, etc.)
- ✅ **Square** - Alternative (optional)
- ✅ **Razorpay** - Indian payments (optional)

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│     TradeZone Payment System            │
├─────────────────────────────────────────┤
│                                         │
│  PaymentGatewayFactory                  │
│  ├─ Manages all gateway instances      │
│  ├─ Routes to correct provider         │
│  ├─ Handles configuration             │
│  └─ Enables/disables gateways         │
│                                         │
├─────────────────────────────────────────┤
│  Individual Gateway Implementations     │
├─────────────────────────────────────────┤
│                                         │
│  StripePaymentGateway                   │
│  ├─ Process deposits (Checkout)        │
│  ├─ Process withdrawals (Payouts)      │
│  ├─ Check status                       │
│  ├─ Handle refunds                     │
│  └─ Validate webhooks                  │
│                                         │
│  PayPalPaymentGateway                   │
│  ├─ Create orders                      │
│  ├─ Process payouts                    │
│  ├─ Check order status                 │
│  ├─ Refund payments                    │
│  └─ Validate webhooks                  │
│                                         │
│  PaystackPaymentGateway                 │
│  ├─ Initialize transactions            │
│  ├─ Process transfers                  │
│  ├─ Verify transactions                │
│  ├─ Refund payments                    │
│  └─ Validate webhooks                  │
│                                         │
└─────────────────────────────────────────┘
        │                │                │
        ▼                ▼                ▼
    Stripe API      PayPal API       Paystack API
```

---

## Setup Instructions

### 1. Stripe Setup

#### Get Your API Keys:
1. Go to https://dashboard.stripe.com
2. Sign up or log in
3. Click **Developers** → **API keys**
4. Copy your:
   - **Publishable key** → `STRIPE_PUBLIC_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
   - **API key** → `STRIPE_API_KEY`
5. Go to **Webhooks** → **Add Endpoint**
   - Set URL to: `{backend-url}/api/payments/webhook/stripe`
   - Select events: `payment_intent.succeeded`, `charge.succeeded`
   - Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

#### Add to .env:
```bash
STRIPE_API_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYMENT_STRIPE_ENABLED=true
```

### 2. PayPal Setup

#### Get Your Credentials:
1. Go to https://developer.paypal.com
2. Sign up or log in
3. Go to **Applications** → **Sandbox** → **Default Application**
4. Copy:
   - **Client ID** → `PAYPAL_CLIENT_ID`
   - **Secret** → `PAYPAL_CLIENT_SECRET`
5. Go to **Account Settings** → **Webhook**
   - Add URL: `{backend-url}/api/payments/webhook/paypal`
   - Copy **Webhook ID** → `PAYPAL_WEBHOOK_ID`

#### Add to .env:
```bash
PAYPAL_CLIENT_ID=AW...
PAYPAL_CLIENT_SECRET=ED...
PAYPAL_MODE=sandbox  # Change to 'live' for production
PAYPAL_WEBHOOK_ID=...
PAYMENT_PAYPAL_ENABLED=true
```

### 3. Paystack Setup

#### Get Your API Keys:
1. Go to https://dashboard.paystack.com
2. Sign up or log in
3. Go to **Settings** → **API Keys & Webhooks**
4. Copy:
   - **Public Key** → `PAYSTACK_PUBLIC_KEY`
   - **Secret Key** → `PAYSTACK_SECRET_KEY`
5. Set Webhook URL to: `{backend-url}/api/payments/webhook/paystack`
   - Copy **Webhook Secret** → `PAYSTACK_WEBHOOK_SECRET`

#### Add to .env:
```bash
PAYSTACK_PUBLIC_KEY=pk_...
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_WEBHOOK_SECRET=...
PAYMENT_PAYSTACK_ENABLED=true
```

---

## Configuration Files

### Payment Service Layer (`backend/src/services/PaymentGatewayService.ts`)
- Defines abstract `PaymentGateway` class
- Implements `PaymentGatewayFactory` for gateway management
- Handles gateway registration, enabling/disabling, and routing

### Gateway Implementations

**StripePaymentGateway** (`backend/src/services/StripePaymentGateway.ts`)
- HMAC-SHA256 webhook validation
- Payment Intent for deposits
- Payouts for withdrawals
- Card and ACH transfer support

**PayPalPaymentGateway** (`backend/src/services/PayPalPaymentGateway.ts`)
- OAuth2 access token management
- Order creation for deposits
- Payout system for withdrawals
- Full refund support

**PaystackPaymentGateway** (`backend/src/services/PaystackPaymentGateway.ts`)
- Transaction initialization
- Transfer management for withdrawals
- Bank recipient management
- Reference-based transaction tracking

### Controllers

**PaymentController** (`backend/src/controllers/PaymentController.ts`)
- User payment operations
- Initiate deposits/withdrawals
- Check payment status
- Process refunds
- Handle webhooks
- Payment history

**AdminPaymentController** (`backend/src/controllers/AdminPaymentController.ts`)
- Gateway configuration management
- Enable/disable gateways
- Update gateway settings (fees, limits, API keys)
- View statistics and volumes
- Test gateway connections

### Routes

**User Routes** (`backend/src/routes/payments.ts`)
- `GET /api/payments/gateways` - List available gateways
- `GET /api/payments/gateways/:currency` - Filter by currency
- `POST /api/payments/initiate` - Start deposit/withdrawal
- `GET /api/payments/:transactionId/status` - Check status
- `POST /api/payments/:transactionId/refund` - Request refund
- `GET /api/payments/history` - Payment history
- `POST /api/payments/webhook/:gatewayId` - Webhook endpoint

**Admin Routes** (`backend/src/routes/adminPayments.ts`)
- `GET /api/admin/payments/gateways` - All configurations
- `GET /api/admin/payments/gateways/:gatewayId` - Specific gateway
- `PUT /api/admin/payments/gateways/:gatewayId` - Update config
- `PATCH /api/admin/payments/gateways/:gatewayId/toggle` - Enable/disable
- `GET /api/admin/payments/gateways/:gatewayId/stats` - Gateway stats
- `GET /api/admin/payments/stats` - All stats
- `GET /api/admin/payments/fees` - Fee summary
- `POST /api/admin/payments/gateways/:gatewayId/test` - Test connection

---

## Usage Examples

### User Initiates Deposit

```bash
curl -X POST http://localhost:3001/api/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "gatewayId": "stripe",
    "type": "deposit",
    "metadata": {
      "email": "user@example.com"
    },
    "returnUrl": "https://app.tradezone.com/payment/success"
  }'
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "transactionId": "pi_1234567890",
    "status": "pending",
    "amount": 100,
    "fee": 2.90,
    "netAmount": 97.10,
    "currency": "USD",
    "gateway": "stripe",
    "checkoutUrl": "https://checkout.stripe.com/...",
    "timestamp": "2026-02-25T10:00:00Z"
  }
}
```

### Check Payment Status

```bash
curl http://localhost:3001/api/payments/pi_1234567890/status?gatewayId=stripe \
  -H "Authorization: Bearer {token}"
```

### Admin Updates Stripe Configuration

```bash
curl -X PUT http://localhost:3001/api/admin/payments/gateways/stripe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin-token}" \
  -d '{
    "enabled": true,
    "minAmount": 5,
    "maxAmount": 50000,
    "feePercentage": 2.9,
    "fixedFee": 0.30,
    "apiKey": "sk_live_...",
    "secretKey": "sk_live_..."
  }'
```

### Get All Gateway Statistics

```bash
curl http://localhost:3001/api/admin/payments/stats?days=30 \
  -H "Authorization: Bearer {admin-token}"
```

**Response:**
```json
{
  "success": true,
  "period": "30 days",
  "stats": [
    {
      "gateway": "Stripe",
      "enabled": true,
      "totalVolume": 50000,
      "totalTransactions": 450,
      "averageTransaction": 111.11
    },
    {
      "gateway": "PayPal",
      "enabled": true,
      "totalVolume": 35000,
      "totalTransactions": 280,
      "averageTransaction": 125.00
    }
  ]
}
```

---

## Database Schema

### payments table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  gateway VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  fee DECIMAL(15,2) NOT NULL,
  net_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'deposit' or 'withdrawal'
  status VARCHAR(50) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### refunds table
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY,
  payment_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP
);
```

---

## Webhook Handling

Each gateway sends webhooks when payment status changes. The system automatically:
1. Validates webhook signatures
2. Updates payment status in database
3. Credits/debits user wallets
4. Sends notifications

### Webhook Endpoints
- Stripe: `POST /api/payments/webhook/stripe`
- PayPal: `POST /api/payments/webhook/paypal`
- Paystack: `POST /api/payments/webhook/paystack`

---

## Fee Configuration

Fees are calculated as: **Amount × Percentage + Fixed Fee**

Example: 10% platform fee on top of gateway fees:
- User deposits $100 with Stripe (2.9% + $0.30 fee)
- Stripe fee: $2.90 + $0.30 = $3.20
- Net amount to account: $96.80

Admin can adjust per-gateway fees in configuration.

---

## Environment Variables

All payment gateway credentials are stored as environment variables:

```bash
# Stripe
STRIPE_API_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=AW...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=...

# Paystack
PAYSTACK_PUBLIC_KEY=pk_...
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_WEBHOOK_SECRET=...

# General Settings
PAYMENT_GATEWAY_MODE=sandbox
PAYMENT_MIN_AMOUNT=10
PAYMENT_MAX_AMOUNT=100000
FRONTEND_URL=http://localhost:5173
```

---

## Security Best Practices

1. **Webhook Validation**: All webhooks are validated with gateway signatures
2. **API Key Storage**: Keys stored in environment variables, never in code
3. **HTTPS Only**: All API calls use HTTPS in production
4. **Rate Limiting**: Payment endpoints have rate limiting enabled
5. **User Verification**: All payments tied to authenticated users
6. **PCI DSS**: Stripe and PayPal are PCI DSS compliant
7. **Encryption**: Sensitive data encrypted in transit and at rest

---

## Troubleshooting

### Gateway not showing in UI
- Check `PAYMENT_{GATEWAY}_ENABLED=true` in .env
- Verify API keys are set correctly
- Test connection: `POST /api/admin/payments/gateways/{id}/test`

### Webhook not working
- Verify webhook URL matches in gateway dashboard
- Check webhook secret is correct in .env
- Look at payment logs for errors

### Payment stuck in pending
- User may not have completed payment on gateway
- Check payment status: `GET /api/payments/{transactionId}/status`
- Force refresh webhook validation

---

## Production Deployment

1. Change `PAYMENT_GATEWAY_MODE=production`
2. Update all API keys to live/production keys
3. Update webhook URLs to production domain
4. Test all gateways with small amounts
5. Enable monitoring and alerts
6. Set up daily reconciliation jobs

---

**Last Updated**: February 25, 2026
**Version**: 1.0

