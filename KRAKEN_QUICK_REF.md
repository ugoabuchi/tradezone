# Kraken Integration - Quick Reference Card

## 🚀 Setup Checklist

```
□ Step 1: Get Kraken API Keys
  └─ Visit: https://www.kraken.com/features/api
  └─ Permissions needed:
    ✓ Query Funds
    ✓ Create & Modify Orders
    ✓ Cancel/Close Orders

□ Step 2: Add to backend/.env
  ├─ KRAKEN_API_URL=https://api.kraken.com
  ├─ KRAKEN_PUBLIC_KEY=<your_public_key>
  ├─ KRAKEN_PRIVATE_KEY=<your_private_key>
  └─ KRAKEN_API_TIER=starter

□ Step 3: Restart Backend
  └─ npm run dev:backend

□ Step 4: Test Trading
  └─ Place test order → Check console for ✅

□ Step 5: Verify on Kraken
  └─ Log in to Kraken → History → Orders
```

---

## 📋 Environment Variables

### Required
```bash
KRAKEN_API_URL=https://api.kraken.com
KRAKEN_PUBLIC_KEY=your_public_key_here
KRAKEN_PRIVATE_KEY=your_private_key_here
KRAKEN_API_TIER=starter  # or intermediate/pro
```

### Optional
```bash
# Already set in backend/.env.example
KRAKEN_UPDATE_INTERVAL=10000
```

---

## 🔄 How Orders Are Processed

```
Order Submission
       ↓
Validate (balance, crypto)
       ↓
Create in database
       ↓
Attempt Kraken submission
    ├─ If configured: Send to Kraken API
    └─ If not: Use demo mode
       ↓
Update wallets locally
       ↓
Return order to frontend
```

---

## 💱 Supported Trading Pairs

### Automatic Conversions
```
BTC → XBTUSDT    (Bitcoin)
ETH → ETHUSDT    (Ethereum)
LTC → LTCUSDT    (Litecoin)
XRP → XRPUSDT    (Ripple)
ADA → ADAUSDT    (Cardano)
DOT → DOTUSDT    (Polkadot)
SOL → SOLUSDT    (Solana)
DOGE → DOGEUSDT  (Dogecoin)
MATIC → MATICUSDT (Polygon)
LINK → LINKUSDT  (Chainlink)
```

### Format for Others
```
{SYMBOL}USDT  ← Default mapping
```

---

## 🔒 Security Quick Tips

```
✅ DO:
  • Store API keys in .env only
  • Use IP whitelisting on Kraken
  • Enable 2FA on Kraken account
  • Rotate keys monthly
  • Test with small amounts first

❌ DON'T:
  • Commit .env to Git
  • Share API keys
  • Use "Withdraw" permission
  • Grant access to all API endpoints
  • Use weak API key names
```

---

## 📊 Console Messages

### Success
```
✅ Order submitted to Kraken: O5N7N5-Q7QQB-4GYJWQ
```

### Demo Mode
```
⚠️  Kraken API not configured. Using demo mode.
Set KRAKEN_PUBLIC_KEY and KRAKEN_PRIVATE_KEY to enable real trading.
```

### Errors
```
EAPI:Invalid key            → Check KRAKEN_PUBLIC_KEY
EAPI:Invalid signature      → Check KRAKEN_PRIVATE_KEY
INSUFFICIENT FUNDS          → Deposit more to Kraken
Rate limit exceeded (429)   → Upgrade API tier or wait
```

---

## ⏱️ Rate Limits

| Tier | Requests/Sec | Cost |
|------|:---:|---|
| Starter | 15 | Free |
| Intermediate | 20 | $ (Low volume discount) |
| Pro | 20 | $$ (High volume discount) |

Set `KRAKEN_API_TIER` in `.env` to track your tier.

---

## 💰 Fee Structure

```
Maker Fee:  0.16%  (Provides liquidity)
Taker Fee:  0.26%  (Takes liquidity)

Volume Discounts:
- 50 BTC/month  → 0.14% / 0.24%
- 100 BTC/month → 0.12% / 0.22%
- 250 BTC/month → 0.10% / 0.20%

Fees deducted automatically by Kraken
```

---

## 🧪 Testing

### Local Testing
```bash
# 1. Without Kraken keys (demo mode)
rm backend/.env  # Remove or leave KRAKEN_* empty
npm run dev:backend

# 2. Place test order
# → Should show: ⚠️ Using demo mode

# 3. With Kraken keys (real)
# Add keys to backend/.env
npm run dev:backend

# 4. Place test order
# → Should show: ✅ Order submitted to Kraken
```

### Verify on Kraken
1. Log into Kraken at https://www.kraken.com
2. Settings → History → Orders
3. Your TradeZone orders should appear here
4. Check status: pending, open, closed, or cancelled

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Demo mode warning | Add `KRAKEN_*` keys to `.env` |
| Invalid signature | Check private key copied exactly |
| Invalid key | Check public key copied exactly |
| Insufficient funds | Deposit to Kraken (not demo wallet) |
| 429 Rate limit | Upgrade tier or reduce request frequency |
| System clock off | Sync system time (important!) |

---

## 📁 Files Changed

```
NEW FILES:
├─ backend/src/services/KrakenService.ts (480 lines)
├─ KRAKEN_SETUP.md
├─ KRAKEN_INTEGRATION_GUIDE.md
├─ KRAKEN_ARCHITECTURE.md
├─ KRAKEN_IMPLEMENTATION.md
└─ KRAKEN_COMPLETE.md

MODIFIED FILES:
├─ backend/src/services/OrderService.ts
└─ backend/.env.example
```

---

## 🎯 Next Actions

### Immediate (Today)
- [ ] Read [KRAKEN_SETUP.md](./KRAKEN_SETUP.md)
- [ ] Get API keys from Kraken
- [ ] Add keys to `backend/.env`
- [ ] Restart backend

### Short-term (This week)
- [ ] Test with small amount
- [ ] Verify order on Kraken
- [ ] Enable IP whitelisting
- [ ] Enable 2FA

### Medium-term (This month)
- [ ] Monitor trading activity
- [ ] Check fees and limits
- [ ] Plan rotation schedule
- [ ] Document team procedures

---

## 📞 Getting Help

### Official Kraken Support
- **Docs**: https://docs.kraken.com/rest/
- **Support**: https://support.kraken.com
- **Status**: https://status.kraken.com

### TradeZone Documentation
- **Quick Setup**: [KRAKEN_SETUP.md](./KRAKEN_SETUP.md) ← Start here!
- **Detailed Guide**: [KRAKEN_INTEGRATION_GUIDE.md](./KRAKEN_INTEGRATION_GUIDE.md)
- **Architecture**: [KRAKEN_ARCHITECTURE.md](./KRAKEN_ARCHITECTURE.md)
- **Implementation**: [KRAKEN_IMPLEMENTATION.md](./KRAKEN_IMPLEMENTATION.md)

---

## ✨ Key Features at a Glance

```
✅ Real Market Trading
   └─ Orders executed on Kraken exchange

✅ Multiple Cryptocurrencies
   └─ BTC, ETH, LTC, XRP, ADA, DOT, SOL, etc.

✅ Order Management
   └─ Place, cancel, monitor orders

✅ Secure Authentication
   └─ HMAC-SHA512 signing

✅ Demo Mode Fallback
   └─ Works without API keys

✅ Automatic Pair Mapping
   └─ BTC → XBTUSDT automatically

✅ Balance Tracking
   └─ Local + Kraken integration

✅ Transaction History
   └─ All trades recorded
```

---

## 💡 Pro Tips

1. **IP Whitelisting**: Set on Kraken for extra security
2. **Small Test**: Always test with 0.001 BTC first
3. **Monitor Fees**: High-frequency trading? Upgrade API tier
4. **Rate Limiting**: Batch requests efficiently
5. **Key Rotation**: Generate new keys monthly
6. **Clock Sync**: Critical for signature validation
7. **Error Logs**: Always check console for details
8. **Kraken Dashboard**: Monitor orders in real-time

---

## 🏁 You're All Set!

Your application now supports professional cryptocurrency trading through Kraken.

**Next Step**: Read [KRAKEN_SETUP.md](./KRAKEN_SETUP.md) ← 5 minutes

---

**Quick Reference Version**: 1.0
**Last Updated**: February 25, 2026
