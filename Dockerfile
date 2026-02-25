# Multi-stage build for TradeZone

# Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/src ./src
COPY backend/tsconfig.json ./
RUN npm run build

# Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/tsconfig*.json ./
COPY frontend/vite.config.ts ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
COPY frontend/index.html ./
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app

# Install backend production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend (static files)
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "backend/dist/index.js"]
