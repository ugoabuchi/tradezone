import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import 'dotenv/config';

import authRoutes from './routes/auth';
import kycRoutes from './routes/kyc';
import walletRoutes from './routes/wallets';
import marketRoutes from './routes/markets';
import orderRoutes from './routes/orders';
import accountRoutes from './routes/account';
import futuresRoutes from './routes/futures';
import stockRoutes from './routes/stocks';
import nftRoutes from './routes/nfts';
import marketplaceRoutes from './routes/marketplace';
import aiTradingRoutes from './routes/aiTrading';
import copyTradingRoutes from './routes/copyTrading';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payments';
import adminPaymentRoutes from './routes/adminPayments';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { setupWebSocket } from './websocket/handlers';
import initializeDatabase from './config/init-db';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/futures', futuresRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/ai-trading', aiTradingRoutes);
app.use('/api/copy-trading', copyTradingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// WebSocket setup
setupWebSocket(io);

// Initialize database and start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('✓ Database initialized');

    server.listen(PORT, () => {
      console.log(`✓ TradeZone API running on http://localhost:${PORT}`);
      console.log(`✓ WebSocket available at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
