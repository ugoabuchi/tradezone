# TradeZone - Crypto Exchange Platform

A professional, production-ready cryptocurrency exchange platform built with modern technologies, featuring real-time trading, live market data, and a secure backend.

## Features

- 🔐 User authentication with JWT and bcrypt encryption
- 💱 Live cryptocurrency trading (buy/sell orders)
- 💵 **Multiple payment gateways** (Stripe, PayPal, Paystack) for fiat deposits/withdrawals
- 🛠️ **Admin payment configuration** - Enable/disable gateways and manage fees
- 📊 **Payment analytics dashboard** - Track volumes, success rates, and fees
- 💼 **Forex currency trading** (EUR/USD, GBP/USD, etc.) via Kraken API
- 💼 **Multi-chain crypto wallet management** (Ethereum, Bitcoin, Solana, Ripple, Polygon)
- 🔒 **KYC-enforced secure transfers** with Tier-based daily/monthly limits
- 🛡️ **2FA verification** for high-value transactions
- 📊 Real-time price updates via WebSocket
- 💼 Portfolio tracking and balance management
- 📈 Price charts with historical data
- 📋 Full order history and management
- 🔄 Real-time order book
- 🛡️ Production-grade security (CORS, rate limiting, input validation, AES-256 encryption)
- 🗄️ PostgreSQL database with optimized queries
- ⚡ Responsive React UI with TypeScript

## Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** for data persistence
- **JWT** for authentication
- **WebSocket** for real-time updates
- **CoinGecko API** for live crypto prices
- **Kraken API** for forex data

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **TailwindCSS** for styling
- **Chart.js** for price visualization
- **Socket.io-client** for WebSocket communication

### DevOps
- **Docker & Docker Compose** for containerization
- **Environment-based configuration**

## Project Structure

```
tradezone/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── websocket/      # WebSocket handlers
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Server entry point
│   ├── .env.example        # Environment variables template
│   └── package.json        # Backend dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # React entry point
│   └── package.json        # Frontend dependencies
└── docker-compose.yml      # Local development setup
```

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Docker and Docker Compose (optional, for database)
- PostgreSQL 14+ (or use Docker)

### Installation

1. **Clone and setup:**
```bash
cd tradezone
npm install
```

2. **Configure environment variables:**

**Backend (.env file):**
```bash
# Database
DATABASE_URL=postgresql://tradezone:password@localhost:5432/tradezone

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRY=7d

# Server
PORT=3001
NODE_ENV=development

# CoinGecko API (free, no key needed)
COINGECKO_API_URL=https://api.coingecko.com/api/v3
```

**Frontend (.env file):**
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

3. **Start with Docker (recommended):**
```bash
docker-compose up -d
npm run dev
```

4. **Or start manually:**

Terminal 1 (Backend):
```bash
cd backend
npm install
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and API at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Markets
- `GET /api/markets` - Get all available cryptocurrencies and forex pairs
- `GET /api/markets/:id` - Get cryptocurrency or forex pair details (symbol)
- `GET /api/markets/forex/pairs` - Get list of available forex pairs

### Trading
- `POST /api/orders` - Create new order (buy/sell crypto or forex)
- `GET /api/orders` - Get user's orders
- `DELETE /api/orders/:id` - Cancel order
- `GET /api/orderbook/:symbol` - Get order book for symbol (works for crypto and forex)

### Account
- `GET /api/account/balance` - Get user balances
- `GET /api/account/portfolio` - Get portfolio information
- `GET /api/account/transactions` - Get transaction history

### Wallet Management (NEW)
- `POST /api/wallets/create` - Create new crypto wallet
- `POST /api/wallets/import` - Import existing wallet by private key
- `GET /api/wallets/list` - List all user wallets with balances
- `GET /api/wallets/balance/:walletId` - Get real-time wallet balance
- `POST /api/wallets/send` - Send crypto (with KYC limit validation & 2FA)
- `GET /api/wallets/receive/:walletId` - Get receiving address
- `GET /api/wallets/transactions/:walletId` - Transaction history
- `POST /api/wallets/whitelist` - Add trusted address
- `GET /api/wallets/whitelist/:walletId` - View whitelisted addresses
- `POST /api/wallets/verify-2fa` - Verify 2FA token

### WebSocket Events
- `prices:crypto:update` - Real-time cryptocurrency price updates
- `prices:forex:update` - Real-time forex price updates
- `orderbook:update` - Order book changes
- `order:update` - Order status changes

## Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token-based authentication
- ✅ CORS protection with whitelist
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization
- ✅ SQL injection protection via ORM/parameterized queries
- ✅ HTTPS support in production
- ✅ Environment-based secrets management
- ✅ Secure WebSocket with authentication
- ✅ **AES-256-CBC encryption** for private key storage
- ✅ **2FA (TOTP) verification** for high-value withdrawals
- ✅ **KYC Tier-based transfer limits** (Tier 0-3 with progressive daily/monthly caps)
- ✅ **Address whitelist** for trusted recipients
- ✅ **Audit logging** of all wallet operations
- ✅ **Withdrawal delays** based on KYC tier (0-48 hours)

## Database Schema

### users
- id, email, password_hash, full_name, kyc_status, kyc_tier, created_at, updated_at

### wallets
- id, user_id, currency, balance, created_at

### crypto_wallets (NEW - Multi-chain support)
- id, user_id, blockchain, currency, public_address, private_key_encrypted, balance, is_primary, created_at

### wallet_transactions (NEW - Complete audit trail)
- id, wallet_id, transaction_type, from_address, to_address, amount, fee, status, blockchain_tx_hash, kyc_level_used, created_at

### kyc_wallet_limits (NEW - Tier-based restrictions)
- id, kyc_tier, daily_limit, monthly_limit, per_transaction_limit, requires_2fa, withdrawal_delay_hours

### orders
- id, user_id, symbol, type, price, quantity, status, created_at

### transactions
- id, user_id, from_currency, to_currency, amount, price, created_at

### payments (NEW - Fiat deposits/withdrawals)
- id, user_id, transaction_id, gateway, amount, fee, status, currency, type, metadata, created_at

### payment_gateway_configs (NEW - Admin configuration)
- id, gateway_name, enabled, is_default, fee_percentage, fixed_fee, min_amount, max_amount, created_at

## Payment Gateways

TradeZone supports multiple payment gateways for secure fiat deposits and withdrawals:

### Supported Gateways

| Gateway | Regions | Currencies | Features |
|---------|---------|-----------|----------|
| **Stripe** | Global | 135+ | Cards, ACH transfers, webhooks |
| **PayPal** | Global | 100+ | Account transfers, instant payouts |
| **Paystack** | Africa-focused | NGN, GHS, ZAR, KES | Bank transfers, low fees |

### Payment Features

- ✅ Instant payment processing
- ✅ Automatic webhook handling
- ✅ Payment status tracking
- ✅ Refund management
- ✅ Transaction reconciliation
- ✅ Admin fee configuration
- ✅ Payment analytics and reporting
- ✅ Multi-currency support
- ✅ Transaction limits (daily/monthly)

### Getting Started with Payments

**Quick Start (15 minutes):**
1. See [PAYMENT_QUICKSTART.md](./PAYMENT_QUICKSTART.md) for rapid setup
2. Get API keys from Stripe, PayPal, and/or Paystack
3. Add to `.env` file
4. API is ready to use

**Detailed Setup:**
- [PAYMENT_GATEWAYS_GUIDE.md](./PAYMENT_GATEWAYS_GUIDE.md) - Complete setup and configuration
- [PAYMENT_API_DOCS.md](./PAYMENT_API_DOCS.md) - API endpoint documentation  
- [ADMIN_PAYMENT_CONFIG.md](./ADMIN_PAYMENT_CONFIG.md) - Admin panel configuration guide

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run lint         # Check code quality
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code quality
```

## Production Deployment

1. **Build:**
```bash
npm run build
```

2. **Set environment variables** in your hosting platform

3. **Start:**
```bash
npm start
```

Or use Docker:
```bash
docker build -t tradezone .
docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 3001:3001 tradezone
```

## Testing

Trading features can be tested with these demo cryptocurrencies:
- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- Cardano (ADA)
- Polkadot (DOT)

## Performance Optimization

- Database connection pooling
- Redis caching for price data (optional)
- Lazy loading of components
- Code splitting in frontend
- WebSocket instead of polling
- Indexed database queries

## License

MIT License - See LICENSE file

## Support

For issues and feature requests, please create an issue in the repository.

## Contributing

We welcome contributions! Please follow these steps:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

**Note:** This is a demo/educational platform. For real trading with real funds, additional regulatory compliance, security audits, and KYC/AML procedures are required.
