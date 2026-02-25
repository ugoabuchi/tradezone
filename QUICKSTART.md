# Quick Start Guide - TradeZone Advanced Features

## 🎯 What's New

Your TradeZone platform now includes:
- ✅ Futures Trading (with leverage & margin)
- ✅ Stock Trading (real market data)
- ✅ NFT Management & Trading
- ✅ P2P Marketplace
- ✅ AI Trading Bots (DeepSeek/Gemini)
- ✅ Copy Trading System
- ✅ Demo Trading (risk-free practice)
- ✅ KYC Verification
- ✅ Forex Trading

**Total API Endpoints**: 50+
**New Database Tables**: 8
**New Features**: 12

---

## ⚙️ Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add required API keys:
```
# Minimum required for testing:
DATABASE_URL=mysql://user:password@localhost:3306/tradezone
JWT_SECRET=your-secret-key
RECAPTCHA_SECRET_KEY=your-recaptcha-key

# Optional but recommended:
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key
FINNHUB_API_KEY=your-finnhub-key
OPENSEA_API_KEY=your-opensea-key
```

### Step 3: Start Database
```bash
docker-compose up -d
```

### Step 4: Run Server
```bash
npm run dev
```

**Server running at**: http://localhost:3001

---

## 🧪 Test the Features

### Test Futures Trading
```bash
curl -X POST http://localhost:3001/api/futures \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USD",
    "side": "long",
    "entryPrice": 50000,
    "quantity": 0.1,
    "leverage": 5,
    "stopLoss": 45000,
    "takeProfit": 55000
  }'
```

### Test Stock Trading
```bash
# Get stock price
curl http://localhost:3001/api/stocks/price/AAPL

# Buy stock
curl -X POST http://localhost:3001/api/stocks/buy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "quantity": 10,
    "price": 150
  }'
```

### Test AI Trading
```bash
curl -X POST http://localhost:3001/api/ai-trading \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botName": "Bitcoin Momentum Bot",
    "strategy": "momentum",
    "symbol": "BTC/USD",
    "initialCapital": 1000,
    "allocatedPercentage": 10,
    "aiModel": "gemini",
    "riskLevel": "medium"
  }'
```

### Test Copy Trading
```bash
# Search traders
curl 'http://localhost:3001/api/copy-trading/search?q=john'

# Follow trader
curl -X POST http://localhost:3001/api/copy-trading/follow \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaderUserId": "trader-id",
    "allocationPercentage": 10
  }'
```

### Test Marketplace
```bash
# Create listing
curl -X POST http://localhost:3001/api/marketplace/listings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Premium NFT",
    "description": "Rare digital artwork",
    "price": 2.5,
    "currency": "ETH",
    "listingType": "nft"
  }'

# Search listings
curl 'http://localhost:3001/api/marketplace/search?q=nft'
```

---

## 📊 Database Tables

New tables automatically created:
- `futures_positions` - Leveraged positions
- `stock_positions` - Stock holdings
- `nft_holdings` - NFT inventory
- `marketplace_listings` - Items for sale
- `marketplace_orders` - Purchases
- `ai_trading_bots` - Bot configs
- `ai_trading_history` - Trade logs
- `copy_trades` - Trader relationships

---

## 🔑 API Key Setup Guide

### DeepSeek AI
1. Visit https://www.deepseek.com
2. Create account and get API key
3. Add to `.env`: `DEEPSEEK_API_KEY=sk-...`

### Google Gemini
1. Go to https://ai.google.dev
2. Get API key from console
3. Add to `.env`: `GEMINI_API_KEY=...`

### Finnhub (Stock Data)
1. Register at https://finnhub.io
2. Get free API key
3. Add to `.env`: `FINNHUB_API_KEY=...`

### OpenSea (NFT Data)
1. Get API key from https://docs.opensea.io
2. Add to `.env`: `OPENSEA_API_KEY=...`

### Google reCAPTCHA
1. Go to https://www.google.com/recaptcha/admin
2. Create new site
3. Add keys to `.env`

---

## 🎮 Demo Account

**Starting Balance**: $50,000 (virtual)

```bash
# Get demo balance
curl -X GET http://localhost:3001/api/futures/demo/balance \
  -H "Authorization: Bearer YOUR_TOKEN"

# Practice trading with no risk!
# Reset anytime:
curl -X POST http://localhost:3001/api/futures/demo/reset \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📈 Feature Highlights

### Futures Trading
- Up to 20x leverage
- Long and short positions
- Automatic stop loss/take profit
- Real-time P&L tracking

### AI Trading
- 3 AI models: DeepSeek, Gemini, Hybrid
- 4 strategies: Momentum, Mean Reversion, Arbitrage, Trend Following
- Risk-adjusted trading
- Performance tracking

### Copy Trading
- Follow top performers
- Automatic trade mirroring
- Portfolio allocation control
- Traders can earn from followers

### Marketplace
- Sell NFTs, products, services
- Crypto payments
- Shipping tracking
- Seller ratings

---

## 🚀 Frontend Pages Ready

Use these components in your React app:
- `/pages/FuturesTradingPage.tsx` - Leverage trading
- `/pages/MarketplacePage.tsx` - P2P marketplace
- `/pages/AITradingPage.tsx` - Bot management
- `/pages/CopyTradingPage.tsx` - Social trading

---

## 📋 API Response Examples

### Futures Position
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "symbol": "BTC/USD",
  "side": "long",
  "entry_price": 50000,
  "current_price": 51000,
  "quantity": 0.1,
  "leverage": 5,
  "pnl": 500,
  "status": "open"
}
```

### AI Bot
```json
{
  "id": "uuid",
  "bot_name": "Bitcoin Momentum",
  "symbol": "BTC/USD",
  "status": "active",
  "initial_capital": 1000,
  "current_balance": 1250,
  "trades_executed": 12,
  "win_rate": 66.7,
  "total_return": 25.0
}
```

### Marketplace Listing
```json
{
  "id": "uuid",
  "title": "Premium NFT",
  "price": 2.5,
  "currency": "ETH",
  "listing_type": "nft",
  "seller_user_id": "uuid",
  "views": 150,
  "status": "active"
}
```

---

## 🔒 Security Enabled

✅ JWT authentication
✅ Rate limiting (100 req/15 min)
✅ reCAPTCHA bot protection
✅ SQL injection prevention
✅ Private key encryption
✅ CORS validation

---

## 🆘 Troubleshooting

### Database Connection Error
```bash
docker-compose ps
docker-compose logs postgres
docker-compose restart postgres
```

### Missing API Keys
Check all required keys are in `.env`:
- DEEPSEEK_API_KEY
- GEMINI_API_KEY
- FINNHUB_API_KEY

### Port Already in Use
Change PORT in `.env`:
```
PORT=3002
```

### Module Not Found
```bash
rm -rf node_modules
npm install
```

---

## 📚 Documentation

- **IMPLEMENTATION_COMPLETE.md** - Full feature list
- **FEATURES_IMPLEMENTATION.md** - Detailed guides
- **FOREX_FEATURE.md** - Forex specifics
- **.env.example** - All config options

---

## 💡 Next Steps

1. **Frontend**: Connect React components to API
2. **Testing**: Run through demo trades
3. **WebSocket**: Add real-time updates
4. **Monitoring**: Set up error tracking
5. **Deployment**: Docker + CI/CD pipeline

---

## ✨ Production Checklist

Before going live:
- [ ] Add HTTPS/SSL certificate
- [ ] Set strong JWT_SECRET
- [ ] Enable database backups
- [ ] Configure error logging
- [ ] Set up monitoring
- [ ] Run security audit
- [ ] Test all features
- [ ] Load test API
- [ ] Set up CDN
- [ ] Configure email notifications

---

## 🎉 You're All Set!

Your TradeZone platform is ready with enterprise-grade trading features.

**Questions?** Check the documentation files or review the API routes in `/src/routes/`

**Good luck!** Happy trading! 🚀
