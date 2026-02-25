import { Server, Socket } from 'socket.io';
import { verifyToken } from '../config/jwt';
import * as CryptoService from '../services/CryptoService';
import * as ForexService from '../services/ForexService';
import { getOrderBook } from '../services/OrderService';

let priceUpdateUnsubscribe: (() => void) | null = null;

export const setupWebSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const payload = verifyToken(token);
        socket.data.userId = payload.userId;
      } catch (error) {
        console.error('WebSocket auth error:', error);
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Price updates (both crypto and forex)
    socket.on('subscribe:prices', async () => {
      socket.emit('subscribed:prices', { message: 'Subscribed to crypto and forex price updates' });
    });

    // Order book subscription
    socket.on('subscribe:orderbook', async (data: { symbol: string }) => {
      const { symbol } = data;
      socket.join(`orderbook:${symbol}`);

      const orderBook = await getOrderBook(symbol);
      socket.emit('orderbook:snapshot', { symbol, ...orderBook });
    });

    socket.on('unsubscribe:orderbook', (data: { symbol: string }) => {
      const { symbol } = data;
      socket.leave(`orderbook:${symbol}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Start broadcasting price updates for both crypto and forex
  if (!priceUpdateUnsubscribe) {
    priceUpdateUnsubscribe = CryptoService.startPriceUpdates((cryptoData) => {
      io.emit('prices:crypto:update', cryptoData);
    });

    ForexService.startPriceUpdates((forexData) => {
      io.emit('prices:forex:update', forexData);
    });
  }
};

export const broadcastOrderBook = (io: Server, symbol: string, orderBook: any) => {
  io.to(`orderbook:${symbol}`).emit('orderbook:update', { symbol, ...orderBook });
};

export const broadcastOrderUpdate = (io: Server, userId: string, order: any) => {
  io.to(`user:${userId}`).emit('order:update', order);
};

export const broadcastOrderBook = (io: Server, symbol: string, orderBook: any) => {
  io.to(`orderbook:${symbol}`).emit('orderbook:update', { symbol, ...orderBook });
};

export const broadcastOrderUpdate = (io: Server, userId: string, order: any) => {
  io.to(`user:${userId}`).emit('order:update', order);
};
