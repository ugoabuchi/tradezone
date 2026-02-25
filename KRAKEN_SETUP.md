# Kraken API Configuration - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Get Your Kraken API Keys

#### Option A: Using Starter Tier (Free)
1. Go to https://www.kraken.com
2. Sign in to your account
3. Click on **Settings** → **API**
4. Click **Generate New Key**
5. Name: `TradeZone-Trading`
6. Select tier: **Starter** (free)
7. Permissions:
   - ☑️ Query Funds
   - ☑️ Query Open Orders & Trades
   - ☑️ Create & Modify Orders
   - ☑️ Cancel/Close Orders
8. Click **Generate Key**

### 2. Copy Your Keys
1. You'll see two items:
   - **"Key"** → This is your `KRAKEN_PUBLIC_KEY`
   - **"Private Key"** → This is your `KRAKEN_PRIVATE_KEY`
2. Copy both to a secure location

### 3. Configure Environment Variables

Create or edit `backend/.env`:

```bash
# Kraken Exchange API Configuration
KRAKEN_API_URL=https://api.kraken.com
KRAKEN_PUBLIC_KEY=your-actual-public-key-here
KRAKEN_PRIVATE_KEY=your-actual-private-key-here
KRAKEN_API_TIER=starter
```

**Example:**
```bash
KRAKEN_API_URL=https://api.kraken.com
KRAKEN_PUBLIC_KEY=abcdef1234567890abcdef1234567890
KRAKEN_PRIVATE_KEY=Hs7JSD+DKdjsH/DKqL9DK+dKDd/dLK9RDKSDsk/dK/Rdsd==
KRAKEN_API_TIER=starter
```

### 4. Restart Your Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev:backend
```

### 5. Test Your Integration

1. Place an order through the TradeZone UI
2. Check your console for:
   ```
   ✅ Order submitted to Kraken: [transaction-id]
   ```
3. Verify in your Kraken account → History → Orders

---

## 🔐 Security Checklist

Before going live:

- [ ] API Keys are stored in `.env` (not in code)
- [ ] `.env` is added to `.gitignore` (never commit secrets)
- [ ] IP Whitelisting is enabled on Kraken (Settings → API)
- [ ] 2FA is enabled on your Kraken account
- [ ] You've tested with small amounts first
- [ ] You monitor Kraken's order history regularly

---

## 📊 Supported Cryptocurrencies

The following cryptocurrencies are automatically mapped to Kraken pairs:

| Symbol | Kraken Pair | Full Name |
|--------|:----------:|-----------|
| BTC | XBTUSDT | Bitcoin |
| ETH | ETHUSDT | Ethereum |
| LTC | LTCUSDT | Litecoin |
| XRP | XRPUSDT | Ripple (XRP) |
| ADA | ADAUSDT | Cardano |
| DOT | DOTUSDT | Polkadot |
| SOL | SOLUSDT | Solana |
| DOGE | DOGEUSDT | Dogecoin |
| MATIC | MATICUSDT | Polygon |
| LINK | LINKUSDT | Chainlink |

For other cryptocurrencies, the format is: `{SYMBOL}USDT`

---

## ⚠️ Troubleshooting

### Orders showing "Demo Mode" warning
**Problem:** Console shows: `⚠️ Kraken API not configured. Using demo mode.`

**Solution:**
- Verify `KRAKEN_PUBLIC_KEY` and `KRAKEN_PRIVATE_KEY` are set in `.env`
- No extra spaces or newlines in the keys
- Restart the backend server

### "Invalid signature" error
**Problem:** Kraken rejects your request with an invalid signature error

**Solution:**
- Check that your `KRAKEN_PRIVATE_KEY` is copied exactly as shown in Kraken
- Verify your system clock is synced (important for nonce validation)
- Don't add extra line breaks when copying the key

### "Insufficient funds" error
**Problem:** Order fails even though you have balance in your wallet

**Solution:**
- Kraken balance and TradeZone wallet are separate
- Deposit funds to your actual Kraken account first
- Check your Kraken balance on their website

### Rate limit exceeded (429 error)
**Problem:** "Too many requests" error from Kraken

**Solution:**
- Upgrade to **Intermediate** API tier for higher limits
- Reduce trading frequency
- Access Kraken API docs for rate limit details

---

## 📈 Order Types Supported

### Limit Orders (Default)
- Specify exact price you want to buy/sell at
- Order waits until market reaches that price
- Example: "Buy 1 BTC at $50,000"

### Market Orders
- Buy/Sell at current market price
- Executes immediately
- Higher fees but guaranteed execution

---

## 💰 Fee Structure

Kraken trading fees (standard):
- **Maker**: 0.16% of trade amount
- **Taker**: 0.26% of trade amount
- **Volume Discounts**: Fees lower with higher 30-day volume

Fees are deducted automatically by Kraken.

---

## 🔗 Useful Links

- **Kraken API Docs**: https://docs.kraken.com/rest/
- **Kraken Settings**: https://www.kraken.com/u/settings/api
- **API Status**: https://status.kraken.com
- **Trading Pair Info**: https://www.kraken.com/en-us/prices

---

## 💡 Tips & Best Practices

1. **Start Small**: Test with small amounts first
2. **Monitor Orders**: Check Kraken dashboard regularly
3. **Use Limits**: Set order size limits to avoid accidental large trades
4. **Rotate Keys**: Generate new API keys monthly
5. **Keep Updated**: Monitor Kraken API status page

---

**For detailed setup instructions, see: [KRAKEN_INTEGRATION_GUIDE.md](./KRAKEN_INTEGRATION_GUIDE.md)**
