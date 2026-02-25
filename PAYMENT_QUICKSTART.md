# Payment Gateway Quick Start

Get your payment system up and running in 15 minutes!

---

## 1. Get Your API Keys (5 minutes)

### Stripe

1. Go to https://dashboard.stripe.com/register
2. Create account (or login)
3. Click **Developers** → **API keys**
4. Copy `Publishable key` (pk_...) and `Secret key` (sk_...)
5. Go to **Webhooks** → **Add endpoint**
   - URL: `https://your-domain.com/api/payments/webhook/stripe`
   - Select: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
   - Copy webhook signing secret (whsec_...)

### PayPal

1. Go to https://developer.paypal.com/dashboard
2. Sign up / login
3. Click **Apps & Credentials** → **Sandbox**
4. Under Business accounts, click your business account
5. Copy **Client ID** and **Secret**
6. Go to **Webhooks** → **Add webhook**
   - URL: `https://your-domain.com/api/payments/webhook/paypal`
   - Select relevant events
   - Copy Webhook ID

### Paystack

1. Go to https://dashboard.paystack.com/signup
2. Sign up / login
3. Click **Settings** → **API Keys & Webhooks**
4. Copy **Public Key** (pk_...) and **Secret Key** (sk_...)
5. Set Webhook URL to: `https://your-domain.com/api/payments/webhook/paystack`
6. Copy Webhook Signing Key

---

## 2. Update Environment Variables (3 minutes)

Edit `backend/.env`:

```bash
# Stripe
STRIPE_API_KEY=sk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# PayPal
PAYPAL_CLIENT_ID=AW_xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=xxxxx

# Paystack
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=xxxxx

# General Settings
PAYMENT_GATEWAY_MODE=sandbox
PAYMENT_MIN_AMOUNT=10
PAYMENT_MAX_AMOUNT=100000
FRONTEND_URL=http://localhost:5173
```

---

## 3. Start the Server (2 minutes)

```bash
# Install dependencies (one-time)
cd backend && npm install

# Start the server
npm run dev
```

The server will:
1. Connect to PostgreSQL
2. Run database migrations automatically
3. Create payment tables
4. Load gateway configurations
5. Start listening on port 3001

---

## 4. Test Payment Flow (5 minutes)

### Test Stripe Deposit

```bash
curl -X POST http://localhost:3001/api/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "deposit",
    "amount": 100,
    "currency": "USD",
    "gatewayId": "stripe",
    "returnUrl": "http://localhost:5173/success"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "payment": {
    "transactionId": "pi_...",
    "status": "pending",
    "amount": 100,
    "fee": 2.90,
    "netAmount": 97.10,
    "checkoutUrl": "https://checkout.stripe.com/pay/..."
  }
}
```

Click the `checkoutUrl` and use test card: `4242 4242 4242 4242`

### Check Payment Status

```bash
curl http://localhost:3001/api/payments/pi_xxxxx/status?gatewayId=stripe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get All Gateways

```bash
curl http://localhost:3001/api/payments/gateways \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5. Admin Configuration (Optional)

### View Gateway Status

```bash
curl http://localhost:3001/api/admin/payments/gateways \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Update Fees

```bash
curl -X PUT http://localhost:3001/api/admin/payments/gateways/stripe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "feePercentage": 2.95,
    "fixedFee": 0.35,
    "enabled": true
  }'
```

### View Statistics

```bash
curl "http://localhost:3001/api/admin/payments/stats?days=30" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 6. Webhook Testing

### Local Testing with Stripe CLI

```bash
# Install stripe CLI (one-time)
brew install stripe/stripe-cli/stripe

# Test webhook locally
stripe listen --forward-to localhost:3001/api/payments/webhook/stripe

# In another terminal, trigger payment
stripe payments create
```

### PayPal Test Mode

1. Go to PayPal Dashboard → Notifications → Test
2. Fill webhook URL
3. Click "Send Test"

### Paystack Test Mode

1. Dashboard → Settings → Webhooks
2. Click "Send Test Event"
3. Check if received correctly

---

## Troubleshooting

### "Gateway not found"
- Check `PAYMENT_GATEWAY_MODE=sandbox` in .env
- Ensure gateway is enabled: `PAYMENT_STRIPE_ENABLED=true`

### "Webhook signature mismatch"
- Verify `STRIPE_WEBHOOK_SECRET` matches exactly (including `whsec_` prefix)
- Copy full secret from gateway dashboard

### "Payment stuck in pending"
- Check payment status endpoint
- Verify webhook was delivered in gateway dashboard
- Look for errors in server logs

### "API key rejected"
- In test mode, use test keys (pk_test_..., sk_test_...)
- Never use live keys in sandbox mode
- Keys are case-sensitive, copy exactly

---

## Key API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/payments/gateways` | List payment gateways |
| POST | `/api/payments/initiate` | Start payment |
| GET | `/api/payments/:id/status` | Check status |
| GET | `/api/payments/history` | Get payment history |
| POST | `/api/payments/webhook/stripe` | Stripe webhook |
| POST | `/api/payments/webhook/paypal` | PayPal webhook |
| POST | `/api/payments/webhook/paystack` | Paystack webhook |
| GET | `/api/admin/payments/gateways` | Admin: View configs |
| PUT | `/api/admin/payments/gateways/:id` | Admin: Update config |
| GET | `/api/admin/payments/stats` | Admin: View stats |

---

## What's Included

✅ **Core Features**
- Multi-gateway support (Stripe, PayPal, Paystack)
- Deposits and withdrawals for fiat currencies
- Automatic webhook processing
- Transaction history and reconciliation
- Admin gateway management
- Complete audit trail

✅ **Security**
- HTTPS-ready architecture
- Webhook signature verification
- API key encryption in database
- JWT authentication for user endpoints
- Role-based admin access control

✅ **Production Ready**
- Database migrations
- Error handling and logging
- Rate limiting
- Input validation
- Comprehensive documentation
- Test endpoints

---

## Next Steps

1. **Frontend Integration** (Optional)
   - Create payment form component
   - Handle redirect from payment gateway
   - Display payment status to user

2. **Testing in Production**
   - Switch to live API keys when ready
   - Test with small amounts first
   - Monitor transaction logs

3. **Advanced Setup** (Optional)
   - Add additional gateways (Square, Razorpay)
   - Implement recurring payments
   - Set up dispute/chargeback handling

---

## Documentation

For detailed information, see:

| Document | Purpose |
|----------|---------|
| `PAYMENT_GATEWAYS_GUIDE.md` | Complete setup guide |
| `PAYMENT_API_DOCS.md` | Full API reference |
| `ADMIN_PAYMENT_CONFIG.md` | Admin panel guide |
| `PAYMENT_IMPLEMENTATION_SUMMARY.md` | Technical overview |

---

## Support & Troubleshooting

**API Issues:**
- Check exact endpoint spelling
- Verify JWT token is valid
- Ensure Content-Type is application/json
- Review API response error codes

**Gateway Issues:**
- Verify API keys copied exactly
- Check webhook URLs in gateway dashboard
- Ensure webhook secrets match .env
- Use test keys for sandbox mode

**Database Issues:**
- Migrations run automatically on server start
- Check PostgreSQL is running: `docker-compose ps`
- Verify DATABASE_URL in .env
- Check migration logs in terminal

---

## Success Checklist

- [ ] Got API keys from all 3 gateways
- [ ] Updated `.env` with credentials
- [ ] Started backend server (`npm run dev`)
- [ ] Called `/api/payments/gateways` successfully
- [ ] Tested deposit via `/api/payments/initiate`
- [ ] Confirmed payment via gateway dashboard
- [ ] Checked payment status endpoint
- [ ] Tested webhook delivery (using test tools)
- [ ] Viewed stats via admin endpoint
- [ ] Updated gateway fees via admin

✅ **If all checked - you're ready to go!**

---

**Time to Deploy:** ~15 minutes
**Difficulty Level:** Easy
**Production Ready:** Yes

Good luck! 🚀

