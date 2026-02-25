# Payment API Documentation

## Authentication

All user endpoints require a valid JWT token in the `Authorization` header:

```bash
Authorization: Bearer <your-jwt-token>
```

Webhook endpoints do NOT require authentication but validate requests using cryptographic signatures from the payment gateway.

---

## User Payment Endpoints

### 1. Get Available Payment Gateways

**Endpoint:** `GET /api/payments/gateways`

**Authentication:** Required

**Description:** Returns all available payment gateways with their details and current status.

**Response:**
```json
{
  "success": true,
  "gateways": [
    {
      "id": "stripe",
      "name": "Stripe",
      "enabled": true,
      "isDefault": true,
      "feePercentage": 2.9,
      "minAmount": 10,
      "maxAmount": 50000,
      "supportedCurrencies": ["USD", "EUR", "GBP", "JPY", "AUD"],
      "icon": "stripe-icon-url",
      "description": "Global payment processor"
    },
    {
      "id": "paypal",
      "name": "PayPal",
      "enabled": true,
      "isDefault": false,
      "feePercentage": 3.49,
      "minAmount": 10,
      "maxAmount": 50000,
      "supportedCurrencies": ["USD", "EUR", "GBP"],
      "icon": "paypal-icon-url",
      "description": "International payment solution"
    }
  ]
}
```

---

### 2. Get Gateways by Currency

**Endpoint:** `GET /api/payments/gateways/:currency`

**Authentication:** Required

**Parameters:**
- `currency` (path parameter): Currency code (e.g., `USD`, `EUR`, `GBP`)

**Description:** Returns payment gateways that support a specific currency.

**Example:**
```bash
GET /api/payments/gateways/USD
```

**Response:**
```json
{
  "success": true,
  "currency": "USD",
  "gateways": [
    {
      "id": "stripe",
      "name": "Stripe",
      "enabled": true,
      "feePercentage": 2.9,
      "minAmount": 10,
      "maxAmount": 50000
    },
    {
      "id": "paypal",
      "name": "PayPal",
      "enabled": true,
      "feePercentage": 3.49,
      "minAmount": 10,
      "maxAmount": 50000
    }
  ]
}
```

---

### 3. Initiate Payment (Deposit or Withdrawal)

**Endpoint:** `POST /api/payments/initiate`

**Authentication:** Required

**Request Body:**
```json
{
  "type": "deposit",
  "amount": 100,
  "currency": "USD",
  "gatewayId": "stripe",
  "paymentMethod": "card",
  "returnUrl": "https://app.tradezone.com/payment/success",
  "metadata": {
    "email": "user@example.com"
  }
}
```

**Parameters:**
- `type` (string): `deposit` or `withdrawal`
- `amount` (number): Amount to deposit/withdraw
- `currency` (string): Currency code (USD, EUR, etc.)
- `gatewayId` (string): Payment gateway ID (stripe, paypal, paystack)
- `paymentMethod` (string): Payment method (card, ach, bank_transfer)
- `returnUrl` (string): URL to redirect after payment completion
- `metadata` (object): Additional data

**Response - Stripe Deposit:**
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
    "checkoutUrl": "https://checkout.stripe.com/pay/...",
    "timestamp": "2026-02-25T10:00:00Z"
  }
}
```

**Response - PayPal Deposit:**
```json
{
  "success": true,
  "payment": {
    "transactionId": "5O190127TK998765T",
    "status": "pending",
    "amount": 100,
    "fee": 3.49,
    "netAmount": 96.51,
    "currency": "USD",
    "gateway": "paypal",
    "approvalUrl": "https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=...",
    "timestamp": "2026-02-25T10:00:00Z"
  }
}
```

**Response - Stripe Withdrawal:**
```json
{
  "success": true,
  "payment": {
    "transactionId": "po_1234567890",
    "status": "processing",
    "amount": 100,
    "fee": 1.00,
    "netAmount": 99.00,
    "currency": "USD",
    "gateway": "stripe",
    "estimatedArrival": "2026-02-27T10:00:00Z",
    "timestamp": "2026-02-25T10:00:00Z"
  }
}
```

---

### 4. Check Payment Status

**Endpoint:** `GET /api/payments/:transactionId/status`

**Authentication:** Required

**Parameters:**
- `transactionId` (path parameter): Transaction ID from payment initiation
- `gatewayId` (query parameter): Payment gateway ID

**Example:**
```bash
GET /api/payments/pi_1234567890/status?gatewayId=stripe
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "transactionId": "pi_1234567890",
    "status": "completed",
    "amount": 100,
    "fee": 2.90,
    "currency": "USD",
    "gateway": "stripe",
    "createdAt": "2026-02-25T10:00:00Z",
    "completedAt": "2026-02-25T10:05:00Z",
    "metadata": {
      "stripePaymentIntentId": "pi_1234567890",
      "stripeStatus": "succeeded"
    }
  }
}
```

---

### 5. Refund Payment

**Endpoint:** `POST /api/payments/:transactionId/refund`

**Authentication:** Required

**Parameters:**
- `transactionId` (path parameter): Transaction ID to refund
- `gatewayId` (query parameter): Payment gateway ID

**Request Body:**
```json
{
  "amount": 100,
  "reason": "Customer requested refund",
  "metadata": {
    "refundReason": "duplicate_charge"
  }
}
```

**Response:**
```json
{
  "success": true,
  "refund": {
    "id": "re_1234567890",
    "transactionId": "pi_1234567890",
    "amount": 100,
    "status": "processing",
    "reason": "Customer requested refund",
    "createdAt": "2026-02-25T10:10:00Z"
  }
}
```

---

### 6. Get Payment History

**Endpoint:** `GET /api/payments/history`

**Authentication:** Required

**Query Parameters:**
- `limit` (number): Number of records to return (default: 20)
- `offset` (number): Pagination offset (default: 0)
- `type` (string): Filter by type (`deposit`, `withdrawal`, or empty for all)
- `status` (string): Filter by status (`completed`, `pending`, `failed`)
- `gateway` (string): Filter by gateway (`stripe`, `paypal`, `paystack`)
- `startDate` (ISO string): Filter by start date
- `endDate` (ISO string): Filter by end date

**Example:**
```bash
GET /api/payments/history?limit=10&type=deposit&status=completed
```

**Response:**
```json
{
  "success": true,
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "payments": [
    {
      "id": "ff550f29-d31f-441e-94f4-f2c1b5a89e3c",
      "transactionId": "pi_1234567890",
      "type": "deposit",
      "amount": 100,
      "fee": 2.90,
      "netAmount": 97.10,
      "currency": "USD",
      "gateway": "stripe",
      "status": "completed",
      "createdAt": "2026-02-25T10:00:00Z",
      "completedAt": "2026-02-25T10:05:00Z"
    },
    {
      "id": "3a7d8e5f-2c4b-48f9-bc6d-9a1f2c8d5e9b",
      "transactionId": "5O190127TK998765T",
      "type": "withdrawal",
      "amount": 50,
      "fee": 0.50,
      "netAmount": 49.50,
      "currency": "USD",
      "gateway": "paypal",
      "status": "processing",
      "createdAt": "2026-02-25T11:00:00Z",
      "completedAt": null
    }
  ]
}
```

---

## Admin Payment Endpoints

### 1. Get All Gateway Configurations

**Endpoint:** `GET /api/admin/payments/gateways`

**Authentication:** Required (Admin only)

**Response:**
```json
{
  "success": true,
  "gateways": [
    {
      "id": "stripe",
      "gatewayName": "stripe",
      "displayName": "Stripe",
      "enabled": true,
      "isDefault": true,
      "feePercentage": 2.9,
      "fixedFee": 0.30,
      "minAmount": 10,
      "maxAmount": 50000,
      "supportedCurrencies": ["USD", "EUR", "GBP"],
      "webhookUrl": "https://api.tradezone.com/payments/webhook/stripe",
      "lastTestedAt": "2026-02-25T09:00:00Z",
      "lastTestResult": "success"
    }
  ]
}
```

---

### 2. Get Specific Gateway Configuration

**Endpoint:** `GET /api/admin/payments/gateways/:gatewayId`

**Authentication:** Required (Admin only)

**Parameters:**
- `gatewayId`: Gateway ID (stripe, paypal, paystack)

**Response:**
```json
{
  "success": true,
  "gateway": {
    "id": "stripe",
    "gatewayName": "stripe",
    "displayName": "Stripe",
    "enabled": true,
    "isDefault": true,
    "feePercentage": 2.9,
    "fixedFee": 0.30,
    "minAmount": 10,
    "maxAmount": 50000,
    "supportedCurrencies": ["USD", "EUR", "GBP"],
    "rateLimitEnabled": true,
    "rateLimitRequestsPerHour": 10000,
    "retryAttempts": 3,
    "timeoutSeconds": 30,
    "webhookUrl": "https://api.tradezone.com/payments/webhook/stripe",
    "lastTestedAt": "2026-02-25T09:00:00Z",
    "lastTestResult": "success"
  }
}
```

---

### 3. Update Gateway Configuration

**Endpoint:** `PUT /api/admin/payments/gateways/:gatewayId`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "enabled": true,
  "isDefault": true,
  "feePercentage": 2.95,
  "fixedFee": 0.35,
  "minAmount": 5,
  "maxAmount": 100000,
  "apiKey": "sk_live_...",
  "apiSecret": "sk_live_secret_...",
  "webhookSecret": "whsec_...",
  "supportedCurrencies": ["USD", "EUR", "GBP", "JPY"],
  "retryAttempts": 3,
  "timeoutSeconds": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gateway configuration updated successfully",
  "gateway": {
    "id": "stripe",
    "enabled": true,
    "isDefault": true,
    "feePercentage": 2.95,
    "fixedFee": 0.35,
    "minAmount": 5,
    "maxAmount": 100000
  }
}
```

---

### 4. Toggle Gateway Status

**Endpoint:** `PATCH /api/admin/payments/gateways/:gatewayId/toggle`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gateway stripe is now disabled",
  "gateway": {
    "id": "stripe",
    "enabled": false
  }
}
```

---

### 5. Get Gateway Statistics

**Endpoint:** `GET /api/admin/payments/gateways/:gatewayId/stats`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `days` (number): Number of days to include (default: 30)

**Response:**
```json
{
  "success": true,
  "gateway": "stripe",
  "period": "30 days",
  "stats": {
    "totalTransactions": 450,
    "successfulTransactions": 435,
    "failedTransactions": 15,
    "successRate": 96.67,
    "totalVolume": 50000,
    "totalFees": 1450,
    "averageTransaction": 111.11,
    "averageProcessingTime": "2.5 seconds"
  }
}
```

---

### 6. Get All Payment Statistics

**Endpoint:** `GET /api/admin/payments/stats`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `days` (number): Number of days to include (default: 30)
- `currency` (string): Filter by currency

**Response:**
```json
{
  "success": true,
  "period": "30 days",
  "totalStats": {
    "totalTransactions": 1200,
    "successfulTransactions": 1155,
    "failedTransactions": 45,
    "successRate": 96.25,
    "totalVolume": 150000,
    "totalFees": 4500,
    "averageTransaction": 125.00
  },
  "byGateway": [
    {
      "gateway": "Stripe",
      "enabled": true,
      "totalVolume": 50000,
      "totalTransactions": 450,
      "averageTransaction": 111.11,
      "successRate": 96.67
    },
    {
      "gateway": "PayPal",
      "enabled": true,
      "totalVolume": 35000,
      "totalTransactions": 280,
      "averageTransaction": 125.00,
      "successRate": 95.71
    }
  ]
}
```

---

### 7. Test Gateway Connection

**Endpoint:** `POST /api/admin/payments/gateways/:gatewayId/test`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "testType": "authentication"
}
```

**Response:**
```json
{
  "success": true,
  "gateway": "stripe",
  "testResult": "success",
  "message": "Gateway connection successful",
  "latency": 145,
  "details": {
    "apiVersion": "2024-02-15",
    "accountStatus": "active",
    "featureSupport": ["deposits", "withdrawals", "refunds", "webhooks"]
  }
}
```

---

## Webhook Endpoints

These endpoints receive automated notifications from payment gateways. They do NOT require authentication but validate requests using cryptographic signatures.

### Stripe Webhook

**Endpoint:** `POST /api/payments/webhook/stripe`

**Signature Verification:** HMAC-SHA256 using `STRIPE_WEBHOOK_SECRET`

**Events Handled:**
- `payment_intent.succeeded` - Deposited funds confirmed
- `payment_intent.payment_failed` - Deposit failed
- `charge.refunded` - Refund processed
- `payout.paid` - Withdrawal confirmed

---

### PayPal Webhook

**Endpoint:** `POST /api/payments/webhook/paypal`

**Signature Verification:** PayPal TLS Certificate + HMAC validation

**Events Handled:**
- `CHECKOUT.ORDER.COMPLETED` - Order completed
- `CHECKOUT.ORDER.APPROVED` - Order approved
- `PAYMENT.SALE.COMPLETED` - Sale completed
- `PAYMENT.SALE.REFUNDED` - Refund processed
- `INVOICING.PAYMENT-RECEIVED` - Payment received

---

### Paystack Webhook

**Endpoint:** `POST /api/payments/webhook/paystack`

**Signature Verification:** HMAC-SHA512 using `PAYSTACK_WEBHOOK_SECRET`

**Events Handled:**
- `charge.success` - Charge successful
- `charge.failed` - Charge failed
- `transfer.success` - Transfer successful
- `transfer.failed` - Transfer failed
- `transfer.reversed` - Transfer reversed

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Amount must be between $10 and $50,000",
    "details": {
      "minAmount": 10,
      "maxAmount": 50000,
      "providedAmount": 5
    }
  }
}
```

### Common Error Codes

| Code | Message | Status |
|------|---------|--------|
| `GATEWAY_NOT_FOUND` | Payment gateway not found | 404 |
| `GATEWAY_DISABLED` | Payment gateway is disabled | 503 |
| `INVALID_AMOUNT` | Amount outside allowed range | 400 |
| `INVALID_CURRENCY` | Currency not supported by gateway | 400 |
| `INSUFFICIENT_BALANCE` | User has insufficient balance | 400 |
| `PAYMENT_FAILED` | Payment processing failed | 500 |
| `WEBHOOK_VALIDATION_FAILED` | Webhook signature invalid | 401 |
| `UNAUTHORIZED` | User not authenticated | 401 |
| `FORBIDDEN` | User lacks permissions | 403 |

---

## Rate Limiting

Payment endpoints are rate limited:

- User endpoints: 60 requests per minute
- Webhook endpoints: No rate limit (signature verified)
- Admin endpoints: 200 requests per hour

Rate limit info is returned in response headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1645864860
```

---

## Testing

### Test Stripe

Use Stripe's test API keys and card numbers:

```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

### Test PayPal

Use PayPal Sandbox: https://sandbox.paypal.com

Sandbox credentials provided during setup.

### Test Paystack

Use Paystack Test Keys from dashboard:
- Test authorization: 4111111111111111
- Expiry: Any future date
- CVV: Any 3 digits

---

## Troubleshooting

### Common Issues

**"Webhook not configured"**
- Ensure webhook secrets are in .env
- Check `STRIPE_WEBHOOK_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYSTACK_WEBHOOK_SECRET`

**"Invalid gateway"**
- Gateway must be enabled by admin
- Check spelling: `stripe`, `paypal`, `paystack`

**"Payment stuck in pending"**
- Check payment status endpoint
- Verify webhook delivery in gateway dashboard
- Contact payment provider support

---

**Last Updated**: February 25, 2026
**API Version**: 1.0

