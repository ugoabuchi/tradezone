# Forex Trading Feature

## Overview

The TradeZone app now supports forex (currency) trading alongside traditional cryptocurrency trading. Users can trade major forex pairs with real-time price data from the Kraken API.

## Supported Forex Pairs

The following forex pairs are currently available:

- **EUR/USD** - Euro / US Dollar
- **GBP/USD** - British Pound / US Dollar
- **USD/JPY** - US Dollar / Japanese Yen
- **USD/CHF** - US Dollar / Swiss Franc
- **AUD/USD** - Australian Dollar / US Dollar
- **USD/CAD** - US Dollar / Canadian Dollar
- **NZD/USD** - New Zealand Dollar / US Dollar

## Backend Changes

### New Files

1. **`backend/src/services/ForexService.ts`** - Handles Kraken API integration
   - Fetches real-time forex data from Kraken's public API
   - Caches data for 15 seconds to minimize API calls
   - Provides bid/ask spreads and 24-hour high/low values

2. **`backend/src/services/MarketService.ts`** - Unified market service
   - Combines cryptocurrency and forex data
   - Intelligently routes requests based on symbol format (forex pairs contain "/")
   - Manages price updates for both asset types

### Updated Files

1. **`backend/src/types/index.ts`**
   - Added `ForexData` interface with forex-specific fields (bid, ask, high_24h, low_24h)
   - Changed `MarketData` to a union type supporting both CryptoData and ForexData
   - Added `assetType` field to distinguish between 'crypto' and 'forex'

2. **`backend/src/controllers/MarketController.ts`**
   - Updated to use unified `MarketService`
   - Added `getForexPairs()` endpoint to list available forex pairs

3. **`backend/src/routes/markets.ts`**
   - Added `GET /api/markets/forex/pairs` endpoint

4. **`backend/src/websocket/handlers.ts`**
   - Now broadcasts separate events: `prices:crypto:update` and `prices:forex:update`
   - Allows clients to listen to specific asset types

5. **`backend/.env.example`**
   - Added `FOREX_UPDATE_INTERVAL` configuration (default: 15000ms)

## Frontend Changes

### New Components

1. **`frontend/src/components/MarketCard.tsx`** - Generic market card component
   - Works with both cryptocurrencies and forex pairs
   - Shows asset type badge (CRYPTO/FOREX)
   - Displays forex-specific data (bid/ask, high/low) when applicable
   - Shows crypto-specific data (volume, market cap) when applicable

### Updated Files

1. **`frontend/src/types/index.ts`**
   - Added `ForexData` interface
   - Extended `MarketData` to support both crypto and forex
   - Added `assetType` field

2. **`frontend/src/store/marketSlice.ts`**
   - Added `markets` array to store combined crypto and forex data
   - Separate `cryptos` and `forex` arrays for filtered access
   - Added `forexPairs` array for available pairs
   - New actions: `updateCryptoPrices`, `updateForexPrices`
   - Updated `fetchMarkets` and new `fetchForexPairs` thunks
   - Replaced `selectedCrypto` with `selectedMarket` (supports both types)

3. **`frontend/src/pages/DashboardPage.tsx`**
   - Added tab toggle between Cryptocurrencies and Forex trading
   - Uses new `MarketCard` component
   - Displays top 6 markets of selected type
   - Updated form reference from `selectedCrypto` to `selectedMarket`

4. **`frontend/src/pages/MarketsPage.tsx`**
   - Added asset type filter buttons (All, Crypto, Forex)
   - Uses new `MarketCard` component
   - Supports search across both crypto and forex data
   - Maintains navigation to dashboard on selection

5. **`frontend/src/components/TradeForm.tsx`**
   - Updated to handle both crypto and forex trading
   - Displays forex-specific information (bid/ask spreads)
   - Adjusts decimal precision based on asset type (5 decimals for forex, 2 for crypto)
   - Shows forex asset type badge
   - Updated quantity placeholder and step values

6. **`frontend/src/services/api.ts`**
   - Added `getForexPairs()` method to marketService

## API Endpoints

### Markets
- `GET /api/markets` - Returns combined list of cryptocurrencies and forex pairs
- `GET /api/markets/:id` - Get specific cryptocurrency or forex pair (uses symbol)
- `GET /api/markets/forex/pairs` - List available forex pair symbols

### Orders (unchanged, works with both crypto and forex)
- `POST /api/orders` - Create buy/sell order (works for any symbol)
- `GET /api/orders` - Get user's orders
- `DELETE /api/orders/:id` - Cancel order
- `GET /api/orders/book/:symbol` - Get order book for any symbol

### WebSocket Events
- `prices:crypto:update` - Real-time cryptocurrency price updates
- `prices:forex:update` - Real-time forex price updates
- Other events remain unchanged

## Data Format Examples

### Cryptocurrency Data
```json
{
  "id": "bitcoin",
  "symbol": "BTC",
  "name": "Bitcoin",
  "price": 42500.50,
  "market_cap": 830000000000,
  "volume_24h": 25000000000,
  "price_change_24h": 2.5,
  "image": "https://...",
  "assetType": "crypto"
}
```

### Forex Data
```json
{
  "id": "eurusd",
  "symbol": "EUR/USD",
  "name": "Euro / US Dollar",
  "price": 1.08765,
  "bid": 1.08763,
  "ask": 1.08767,
  "volume_24h": 500000000,
  "price_change_24h": 0.35,
  "high_24h": 1.09234,
  "low_24h": 1.08432,
  "image": "",
  "assetType": "forex"
}
```

## Using Kraken API

### Public Endpoints (No Authentication Required)

The implementation uses Kraken's public REST API:

**Ticker Endpoint:**
```
GET https://api.kraken.com/0/public/Ticker?pair=EURUSD,GBPUSD,...
```

**Asset Pairs Endpoint:**
```
GET https://api.kraken.com/0/public/AssetPairs
```

### Rate Limiting

Kraken's public API has generous rate limits:
- Standard public API: 15 requests per second per IP
- The current implementation updates prices every 15 seconds to stay well within limits

## Configuration

### Environment Variables

No additional authentication is required for Kraken's public API endpoints. The service works out of the box with default configuration.

**Optional customization in `.env`:**
```bash
# Forex price update interval (milliseconds)
FOREX_UPDATE_INTERVAL=15000
```

## Trading with Forex

Users can:

1. **Browse Forex Pairs** - Navigate to Markets page and filter by "Forex"
2. **Monitor Prices** - View real-time bid/ask spreads and 24-hour high/low
3. **Place Orders** - Buy/Sell orders work exactly like cryptocurrencies
4. **Track Holdings** - Orders appear in the same order history as crypto orders
5. **View Order Books** - See pending buy/sell orders for any forex pair

## Technical Implementation

### Symbol Naming Convention

- **Cryptocurrencies:** BTC, ETH, LTC (single symbol)
- **Forex Pairs:** EUR/USD, GBP/USD (format with "/" delimiter)

The system automatically detects forex pairs by the presence of "/" in the symbol.

### Caching Strategy

- **Cryptocurrency data:** Cached for 30 seconds
- **Forex data:** Cached for 15 seconds

This minimizes API calls while providing near real-time price updates.

### WebSocket Integration

Frontend clients can listen to separate streams:

```javascript
socket.on('prices:crypto:update', (data) => {
  // Handle crypto price updates
});

socket.on('prices:forex:update', (data) => {
  // Handle forex price updates
});
```

## Future Enhancements

Potential improvements:

1. **More Forex Pairs** - Add commodity pairs, emerging market currencies
2. **Authenticated API** - Support private Kraken endpoints for advanced features
3. **Price Charts** - Historical price data for technical analysis
4. **Economic Calendar** - Forex-specific economic events
5. **Multiple Data Providers** - Support forex from multiple sources
6. **Leverage Trading** - Support for margin trading on forex
7. **Custom Alerts** - Price alerts for specific levels on forex pairs

## Notes

- Forex trading uses the same order system as crypto - all orders are stored in the `orders` table
- Forex pairs currently use USD as the quote currency for consistency
- The system supports any symbol format, making it easy to add other asset types (commodities, indices) in the future
