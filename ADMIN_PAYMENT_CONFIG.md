# Admin Payment Configuration Guide

This guide walks admins through configuring and managing payment gateways in TradeZone.

---

## Table of Contents

1. [Accessing Admin Panel](#accessing-admin-panel)
2. [Gateway Management](#gateway-management)
3. [Fee Configuration](#fee-configuration)
4. [Limits & Restrictions](#limits--restrictions)
5. [Monitoring & Analytics](#monitoring--analytics)
6. [Troubleshooting](#troubleshooting)

---

## Accessing Admin Panel

### Prerequisites

- Admin account with `admin` role
- Valid JWT authentication token

### Login

1. Navigate to admin dashboard: `http://localhost:3001/admin`
2. Enter admin credentials
3. Navigate to **Payments** → **Gateways**

---

## Gateway Management

### View All Gateways

**Admin API Endpoint:**
```
GET /api/admin/payments/gateways
```

**What You See:**
- List of all configured payment gateways
- Current status (enabled/disabled)
- Which gateway is default
- Fees and transaction limits
- Last test result and timestamp

### Enable/Disable Gateway

**Admin UI:** Click the toggle switch on any gateway

**Admin API Endpoint:**
```bash
PATCH /api/admin/payments/gateways/stripe/toggle
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "enabled": true
}
```

**Why Disable a Gateway?**
- Maintenance or updates
- Fraud detection
- Temporarily reduce payment options
- Testing new configuration

### Set Default Gateway

The **default gateway** is offered first to users. If it fails, others are tried automatically.

**Admin UI:**
- Click **Set Default** on any gateway card

**Admin API Endpoint:**
```bash
PUT /api/admin/payments/gateways/paypal
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "isDefault": true
}
```

**Recommendation:** Keep Stripe as default (highest reliability = 96.7% success rate)

---

## Fee Configuration

### Understanding Fees

Fees have two components:

**1. Percentage Fee**
- Applied as % of transaction amount
- Example: $100 deposit with 2.9% fee = $2.90 fee

**2. Fixed Fee**
- Flat amount per transaction
- Example: $100 deposit with $0.30 fee = $0.30 fee

**Total Fee = (Amount × Percentage%) + Fixed Fee**

Example Calculation:
```
Deposit: $100 USD
Stripe Percentage Fee: 2.9%
Stripe Fixed Fee: $0.30
Paystack Percentage Fee: 1.5%
Paystack Fixed Fee: $0

Stripe Total: ($100 × 0.029) + $0.30 = $3.20
Paystack Total: ($100 × 0.015) + $0 = $1.50
```

### Update Gateway Fees

**Admin UI:**
1. Click on gateway card
2. Edit **Fee Percentage** and **Fixed Fee**
3. Click **Save**

**Admin API Endpoint:**
```bash
PUT /api/admin/payments/gateways/stripe
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "feePercentage": 2.95,
  "fixedFee": 0.35
}
```

### Fee Management Strategy

| Strategy | Action | Use Case |
|----------|--------|----------|
| **Absorb Fees** | Set platform fees to 0% | Attract customers |
| **Pass Through** | Match gateway fees exactly | Cost-neutral operation |
| **Premium** | Add 1-2% margin | Profit generation |
| **Variable** | Higher for large transactions | Reduce fraud risk |

### Current Fee Structure

| Gateway | Percentage | Fixed | Total on $100 |
|---------|-----------|-------|----------------|
| Stripe | 2.9% | $0.30 | $3.20 |
| PayPal | 3.49% | $0.30 | $3.79 |
| Paystack | 1.5% | $0 | $1.50 |

---

## Limits & Restrictions

### Set Transaction Limits

**Min & Max Amounts**

Limits protect against:
- Fraud (limit max per transaction)
- Processing errors (require minimum)
- Regulatory compliance

**Admin UI:**
1. Click gateway settings
2. Set **Min Amount** and **Max Amount**
3. Save changes

**Admin API:**
```bash
PUT /api/admin/payments/gateways/stripe
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "minAmount": 5,
  "maxAmount": 100000,
  "supportedCurrencies": ["USD", "EUR", "GBP", "JPY", "AUD"]
}
```

### Recommended Limits

| Gateway | Min | Max | Reason |
|---------|-----|-----|--------|
| Stripe | $5 | $100,000 | Per-transaction limits |
| PayPal | $10 | $50,000 | Account balance limits |
| Paystack | $10 | $20,000 | Regional regulations |

### Configure Retry Behavior

When a payment fails, the system can automatically retry:

**Admin API:**
```bash
PUT /api/admin/payments/gateways/stripe
Content-Type: application/json
Authorization: Bearer {admin-token}

{
  "retryAttempts": 3,
  "retryIntervalSeconds": 60,
  "timeoutSeconds": 30
}
```

**Value Guidelines:**
- `retryAttempts`: 1-5 (3 is typical)
- `retryIntervalSeconds`: 30-300 (60 recommended)
- `timeoutSeconds`: 15-60 (30 recommended)

---

## Monitoring & Analytics

### View Gateway Statistics

**Admin UI Path:** Payments → Analytics

**Admin API Endpoint:**
```bash
GET /api/admin/payments/stats?days=30
Authorization: Bearer {admin-token}
```

**Response Contains:**
```json
{
  "period": "30 days",
  "totalStats": {
    "totalTransactions": 1200,
    "successfulTransactions": 1155,
    "failedTransactions": 45,
    "successRate": 96.25,
    "totalVolume": "$150,000",
    "totalFees": "$4,500"
  },
  "byGateway": [
    {
      "name": "Stripe",
      "totalVolume": "$50,000",
      "transactions": 450,
      "successRate": "96.67%"
    }
  ]
}
```

### Key Metrics

| Metric | Target | Action |
|--------|--------|--------|
| Success Rate | > 95% | Alert if below |
| Avg Processing Time | < 5s | Investigate if > 10s |
| Failed Transactions | < 5% | Review failure reasons |
| Total Volume | Trending | Budget capacity planning |

### Health Check Dashboard

**Admin API:**
```bash
GET /api/admin/payments/gateways/stripe/health
Authorization: Bearer {admin-token}
```

**Shows:**
- Last successful transaction
- Gateway API availability
- Webhook delivery status
- Certificate/key validity

### Real-Time Monitoring

Monitor webhook deliveries in real-time:

**Stripe:**
- Dashboard → Developers → Webhooks
- See all events and delivery status

**PayPal:**
- Account → Notifications → Webhook Notifications
- Monitor listener activity

**Paystack:**
- Dashboard → Settings → WebHooks
- View recent deliveries

---

## Troubleshooting

### Gateway Disabled Unexpectedly

**Symptoms:** Customers can't see payment gateway option

**Causes:**
1. Admin disabled it
2. Multiple failed transactions triggered auto-disable
3. API keys expired

**Solution:**
```bash
# Check status
GET /api/admin/payments/gateways/stripe
Authorization: Bearer {admin-token}

# Re-enable if needed
PATCH /api/admin/payments/gateways/stripe/toggle
"enabled": true
```

### Payment Stuck in "Pending"

**Symptoms:** Payment shows pending but customer not charged

**Causes:**
1. Webhook delivery failed
2. Network timeout during processing
3. Payment gateway outage

**Solution:**
```bash
# Check payment detail
GET /api/payments/{transactionId}/status
Authorization: Bearer {user-token}

# Admin can manually resolve
PUT /api/admin/payments/{transactionId}/status
"status": "completed"
"manuallyResolved": true
"reason": "webhook_delivery_timeout"
```

### Webhook Not Working

**Symptoms:** Payments complete on gateway but don't update in TradeZone

**Causes:**
1. Webhook URL not configured correctly
2. Webhook secret (signature) incorrect
3. Network firewall blocking incoming requests

**Solution:**

**Stripe:**
1. Go to Dashboard → Developers → Webhooks
2. Edit endpoint → Check URL is correct
3. Get signing secret → Add to `.env` as `STRIPE_WEBHOOK_SECRET`
4. Test webhook delivery → Resend event

**PayPal:**
1. Go to Account → Notifications → Webhook Preferences
2. Verify Webhook URL in settings
3. Clear webhook cache if needed
4. Use "Send IPN" to test

**Paystack:**
1. Dashboard → Settings → Webhooks
2. Verify URL matches exactly
3. Check secret key in webhook events
4. Resend final webhook

### High Failure Rate

**Investigate:**
```bash
# Get failed transactions
GET /api/admin/payments/stats?days=7&status=failed
Authorization: Bearer {admin-token}

# Check for patterns
GET /api/admin/payments/failures/report
Authorization: Bearer {admin-token}
```

**Common Causes:**
- Insufficient funds in merchant account
- Incorrect API keys
- Rate limiting exceeded
- Unsupported currency/card

### Rate Limiting

Each gateway has rate limits:

| Gateway | Limit |
|---------|-------|
| Stripe | 100 req/sec |
| PayPal | 50 req/sec |
| Paystack | 30 req/sec |

**If Rate Limited:**
- Implementation automatically retries
- Configure backoff strategy
- Contact gateway for quota increase

### Testing Configuration Changes

**Always test before going live:**

```bash
# Test authentication
POST /api/admin/payments/gateways/stripe/test
Authorization: Bearer {admin-token}

{
  "testType": "authentication"
}

# Test transaction processing
POST /api/admin/payments/gateways/stripe/test
Authorization: Bearer {admin-token}

{
  "testType": "transaction",
  "amount": 1.00,
  "currency": "USD"
}

# Test webhook delivery
POST /api/admin/payments/gateways/stripe/test
Authorization: Bearer {admin-token}

{
  "testType": "webhook"
}
```

---

## Best Practices

### 1. Resource Management

- Keep at least 2 gateways active for redundancy
- Rotate API keys quarterly
- Keep test and production keys separate

### 2. Security

- Never share webhook secrets
- Rotate API keys if compromised
- Monitor webhook delivery logs
- Use IP whitelisting if available

### 3. Customer Experience

- Keep default gateway as most reliable
- Show fees to customers upfront
- Provide payment status updates
- Have clear support process for failing payments

### 4. Compliance

- Follow PCI DSS requirements
- Maintain transaction logs for 7 years
- Verify KYC/AML before large withdrawals
- Report suspicious patterns

### 5. Performance

- Monitor success rates weekly
- Set up alerts for failures > 10%
- Review failed transaction reasons monthly
- Adjust limits based on volume

---

## API Reference Quick Links

| Task | Endpoint | Method |
|------|----------|--------|
| List gateways | `/api/admin/payments/gateways` | GET |
| Get gateway | `/api/admin/payments/gateways/:id` | GET |
| Update settings | `/api/admin/payments/gateways/:id` | PUT |
| Toggle enable/disable | `/api/admin/payments/gateways/:id/toggle` | PATCH |
| Get statistics | `/api/admin/payments/stats` | GET |
| Test gateway | `/api/admin/payments/gateways/:id/test` | POST |

---

## Support

For issues or questions:

1. **Check this guide** for common problems
2. **Review API docs** for endpoint details
3. **Check gateway dashboards** for API status
4. **Contact support** with transaction IDs and timestamps

---

**Last Updated**: February 25, 2026
**Version**: 1.0

