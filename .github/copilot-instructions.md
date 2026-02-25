# TradeZone - Crypto Exchange App

A professional, production-ready cryptocurrency exchange platform built with modern full-stack technologies.

## Project Structure

```
tradezone/
├── backend/              # Node.js/Express API server
│   ├── src/
│   │   ├── config/      # Configuration (DB, JWT, etc)
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/  # Custom middleware
│   │   ├── models/      # Database queries
│   │   ├── routes/      # API route definitions
│   │   ├── services/    # Business logic
│   │   ├── types/       # TypeScript types
│   │   ├── utils/       # Utility functions
│   │   ├── websocket/   # WebSocket handlers
│   │   └── index.ts     # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client
│   │   ├── store/       # Redux state management
│   │   ├── types/       # TypeScript types
│   │   ├── hooks.ts     # Custom hooks
│   │   ├── App.tsx      # Main app component
│   │   ├── main.tsx     # React entry point
│   │   └── index.css    # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
├── docker-compose.yml   # MySQL development setup
├── package.json         # Root workspace package.json
└── README.md
```

## Tech Stack

### Backend
- Node.js 16+ with Express.js
- TypeScript for type safety
- MySQL database with connection pooling
- JWT authentication with bcrypt hashing
- Socket.io for real-time WebSocket communication
- CoinGecko API for live cryptocurrency data
- Rate limiting and security middleware

### Frontend
- React 18 with TypeScript
- Vite for fast bundling
- Redux Toolkit for state management
- React Router for navigation
- TailwindCSS for styling
- Socket.io-client for real-time updates
- Axios for API communication

## Features

✅ User Authentication
- Secure registration and login
- JWT token-based authentication
- Password hashing with bcrypt

✅ Trading
- Buy/Sell orders for multiple cryptocurrencies
- Order status tracking (pending, filled, cancelled)
- Order history and management
- Auto-fill order matching

✅ Markets
- Real-time cryptocurrency prices from CoinGecko
- Live price updates via WebSocket
- Order book view
- Market data and statistics

✅ Account Management
- Wallet management with multiple currencies
- Portfolio tracking
- Balance display with USD valuation
- Transaction history

✅ Security
- CORS protection
- Rate limiting
- Input validation
- SQL injection protection
- Secure WebSocket with token verification

## Quick Start

### Prerequisites
- Node.js 16+
- Docker and Docker Compose (recommended)
- MySQL 8+ (or use Docker)

### Installation & Setup

1. **Clone/Navigate to project:**
```bash
cd tradezone
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**

Create `.env` in `backend/` directory:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

Create `.env` in `frontend/` directory:
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

4. **Start MySQL (using Docker):**
```bash
docker-compose up -d
```

5. **Start both backend and frontend:**
```bash
npm run dev
```

Or run separately:

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

Access the application at: `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Markets
- `GET /api/markets` - Get all cryptocurrencies
- `GET /api/markets/:id` - Get specific cryptocurrency

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `DELETE /api/orders/:id` - Cancel order
- `GET /api/orders/book/:symbol` - Get order book

### Account
- `GET /api/account/balance` - Get wallet balances
- `GET /api/account/portfolio` - Get portfolio summary
- `GET /api/account/transactions` - Get transaction history

### WebSocket Events
- `prices:update` - Real-time price updates
- `orderbook:update` - Order book updates
- `order:update` - Order status changes

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start with hot reload
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

### Build
```bash
npm run build
```

### Start
```bash
npm start
```

### Docker Deployment
```bash
docker build -t tradezone .
docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 3001:3001 tradezone
```

## Database Schema

### users
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- full_name (VARCHAR)
- created_at, updated_at (TIMESTAMP)

### wallets
- id (UUID, PK)
- user_id (UUID, FK)
- currency (VARCHAR)
- balance (DECIMAL)
- created_at, updated_at (TIMESTAMP)

### orders
- id (UUID, PK)
- user_id (UUID, FK)
- symbol (VARCHAR)
- type (VARCHAR: 'buy' | 'sell')
- price, quantity (DECIMAL)
- status (VARCHAR: 'pending' | 'filled' | 'cancelled')
- created_at, filled_at (TIMESTAMP)

### transactions
- id (UUID, PK)
- user_id (UUID, FK)
- from_currency, to_currency (VARCHAR)
- amount, price (DECIMAL)
- created_at (TIMESTAMP)

## Testing

### Demo Credentials (after first registration)
Email: demo@example.com
Password: demo123456

### Demo Cryptocurrencies
- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- Cardano (ADA)
- Polkadot (DOT)

## Performance Optimization

- Database connection pooling
- Redis caching (optional)
- API response caching
- Frontend code splitting
- Lazy loading of components
- Optimized database indexes

## Security Best Practices Implemented

✅ Password hashing with bcrypt
✅ JWT token-based authentication
✅ CORS with origin whitelist
✅ Rate limiting on API endpoints
✅ Input validation and sanitization
✅ Environment-based secrets
✅ SQL injection protection
✅ Secure WebSocket communication
✅ Error handling without exposing details
✅ HTTPS-ready (use reverse proxy in production)

## Environment Variables

### Backend (.env)
```
DATABASE_URL=mysql://user:pass@localhost:3306/tradezone
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_UPDATE_INTERVAL=10000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Troubleshooting

### Database Connection Error
```bash
# Check if MySQL is running
docker-compose ps

# View logs
docker-compose logs mysql

# Restart if needed
docker-compose restart mysql
```

### Port Already in Use
- Backend default: 3001
- Frontend default: 5173
- MySQL default: 3306

### CORS Errors
Check that `CORS_ORIGIN` in backend `.env` matches your frontend URL

### WebSocket Connection Failed
Ensure WebSocket URL matches your backend WebSocket endpoint

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License

## Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Disclaimer:** This is a demo/educational platform. For production use with real funds, additional regulatory compliance, security audits, and KYC/AML procedures are required.
