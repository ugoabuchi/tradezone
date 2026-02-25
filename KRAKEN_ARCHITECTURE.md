# Kraken Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    TradeZone Frontend (React)                     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Trading UI                                                │ │
│  │  - Buy/Sell Forms                                          │ │
│  │  - Order History                                           │ │
│  │  - Real-time Prices (from CoinGecko)                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP/WebSocket
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                 TradeZone Backend (Node.js/Express)              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  OrderController / OrderService                            │ │
│  │  - Validates user balance                                  │ │
│  │  - Creates order in database                               │ │
│  │  - Routes to Kraken or Demo mode                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                       │
│           ┌───────────────┼───────────────┐                      │
│           │               │               │                      │
│  ┌────────▼────────────────▼───────────────▼────────┐           │
│  │      Order Processing                           │           │
│  │  ┌──────────────────────────────────────────┐  │           │
│  │  │  If Kraken configured:                   │  │           │
│  │  │  ✓ KrakenService.placeBuyOrder()        │  │           │
│  │  │  ✓ KrakenService.placeSellOrder()       │  │           │
│  │  │  ✓ Store Kraken transaction ID          │  │           │
│  │  │                                          │  │           │
│  │  │  Else: Demo Mode                        │  │           │
│  │  │  ✓ Auto-fill order                      │  │           │
│  │  │  ✓ Update local wallet balance          │  │           │
│  │  └──────────────────────────────────────────┘  │           │
│  │  │                                              │           │
│  │  └──────────────────────────────────────────────┘           │
│  │                                                              │
│  │  ┌──────────────────────────────────────────┐               │
│  │  │  Database (PostgreSQL)                   │               │
│  │  │  - User orders                           │               │
│  │  │  - Wallet balances                       │               │
│  │  │  - Transaction history                   │               │
│  │  │  - Kraken transaction IDs                │               │
│  │  └──────────────────────────────────────────┘               │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  KrakenService (Backend/src/services/KrakenService.ts)    │ │
│  │                                                            │ │
│  │  Authentication:                                           │ │
│  │  ✓ HMAC-SHA512 signing                                    │ │
│  │  ✓ Nonce-based validation                                 │ │
│  │  ✓ API key rotation support                               │ │
│  │                                                            │ │
│  │  Private Endpoints (Authenticated):                        │ │
│  │  ✓ /private/Balance         - Get account balance         │ │
│  │  ✓ /private/AddOrder        - Place orders               │ │
│  │  ✓ /private/CancelOrder     - Cancel orders              │ │
│  │  ✓ /private/OpenOrders      - Get open orders            │ │
│  │  ✓ /private/ClosedOrders    - Get order history          │ │
│  │  ✓ /private/QueryOrders     - Get order status           │ │
│  │                                                            │ │
│  │  Public Endpoints (No Auth):                              │ │
│  │  ✓ /public/Ticker           - Get prices                 │ │
│  │  ✓ /public/OHLC             - Get candlestick data       │ │
│  │  ✓ /public/Depth            - Get order book             │ │
│  │  ✓ /public/Trades           - Get recent trades          │ │
│  │  ✓ /public/AssetPairs       - Get trading pairs          │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTPS/REST API
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Kraken Exchange API                            │
│                    https://api.kraken.com                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Trading Engine                                           │ │
│  │  - Order Matching                                         │ │
│  │  - Price Execution                                        │ │
│  │  - Fee Deduction                                          │ │
│  │  - Balance Updates                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  User Account Features                                    │ │
│  │  - Wallet Management                                      │ │
│  │  - Order History                                          │ │
│  │  - Trading Fees (0.16% maker, 0.26% taker)              │ │
│  │  - Security Settings (2FA, IP Whitelist)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### Buy Order Example
```
1. User clicks "Buy 1 BTC"
   ↓
2. Frontend POSTs to /api/orders
   {
     "symbol": "BTC",
     "type": "buy",
     "price": 45000,
     "quantity": 1
   }
   ↓
3. OrderService.createOrder() validates:
   • User exists ✓
   • BTC is valid cryptocurrency ✓
   • User has $45,000 USD ✓
   ↓
4. Creates order in database
   Status: "pending"
   ↓
5. executeOrderOnKraken() is called
   ↓
6. Check if KRAKEN_PUBLIC_KEY configured
   ├─ YES: Call Kraken API
   │  └─ KrakenService.placeBuyOrder("XBTUSDT", 1, 45000)
   │     ├─ Generates HMAC-SHA512 signature
   │     ├─ Sends: POST /0/private/AddOrder
   │     └─ Receives: txid = "O5N7N5-Q7QQB-4GYJWQ"
   │        └─ Store in database
   │
   │  ✅ "✅ Order submitted to Kraken: O5N7N5-Q7QQB-4GYJWQ"
   │
   └─ NO: Demo mode
      └─ ⚠️ "Kraken API not configured. Using demo mode."
   ↓
7. fillOrder() updates wallets:
   • Deduct $45,000 from user's USD wallet
   • Add 1 BTC to user's BTC wallet
   • Update order status: "filled"
   ↓
8. Return order to frontend
   {
     "id": "order-123",
     "symbol": "BTC",
     "type": "buy",
     "quantity": 1,
     "price": 45000,
     "status": "filled",
     "krakenTxId": "O5N7N5-Q7QQB-4GYJWQ" // if Kraken
   }
   ↓
9. Frontend displays success
   "1 BTC purchased for $45,000"
```

## Environment Configuration

```
backend/
├── .env (Your file - don't commit)
│   ├── DATABASE_URL
│   ├── JWT_SECRET
│   ├── PORT=3001
│   ├── KRAKEN_API_URL=https://api.kraken.com
│   ├── KRAKEN_PUBLIC_KEY=<your_key>  ← From Kraken
│   ├── KRAKEN_PRIVATE_KEY=<your_key> ← From Kraken
│   └── KRAKEN_API_TIER=starter|intermediate|pro
│
└── .env.example (Template - checked in)
    └── (Same as above, but with placeholder values)
```

## Data Flow During Order Execution

```
Frontend Request
    │
    ├─ Routes: POST /api/orders
    │
    ├─ OrderController.createOrder()
    │   ├─ Extract: symbol, type, price, quantity
    │   └─ Call: OrderService.createOrder()
    │
    ├─ OrderService
    │   ├─ getCryptoBySymbol() - Verify crypto exists
    │   ├─ WalletModel.getBalance() - Check funds
    │   ├─ OrderModel.createOrder() - Insert into DB
    │   └─ executeOrderOnKraken()
    │       │
    │       ├─ Check env vars set?
    │       │   ├─ YES → KrakenService
    │       │   │   ├─ Build request payload
    │       │   │   ├─ Generate HMAC-SHA512 signature
    │       │   │   ├─ Add nonce (current timestamp)
    │       │   │   └─ POST to Kraken API
    │       │   │       └─ Response: txid
    │       │   │
    │       │   └─ NO → Log warning, continue
    │       │
    │       └─ fillOrder()
    │           ├─ If BUY:
    │           │   ├─ Deduct USD from wallet
    │           │   ├─ Add crypto to wallet
    │           │   └─ Create transaction record
    │           │
    │           └─ If SELL:
    │               ├─ Deduct crypto from wallet
    │               ├─ Add USD to wallet
    │               └─ Create transaction record
    │
    └─ Return: Order object to frontend
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│    Kraken API Security Layers           │
├─────────────────────────────────────────┤
│                                         │
│  1. API Key Authentication              │
│     └─ KRAKEN_PUBLIC_KEY                │
│        (sent with every request)        │
│                                         │
│  2. Request Signing (HMAC-SHA512)      │
│     ├─ Input: API Private Key           │
│     ├─ Input: Request Nonce (timestamp) │
│     ├─ Input: POST Data                 │
│     └─ Output: API-Sign header          │
│                                         │
│  3. Nonce Validation                    │
│     ├─ Replay attack prevention         │
│     ├─ Timestamp: NOT older than 15 sec │
│     └─ Each request must have unique    │
│        sequence number                  │
│                                         │
│  4. API Key Permissions                 │
│     ├─ Query Funds only                 │
│     ├─ Trading only (no withdrawals)    │
│     └─ IP Whitelisting (optional)       │
│                                         │
│  5. Rate Limiting                       │
│     ├─ Starter: 15 req/sec              │
│     ├─ Intermediate: 20 req/sec         │
│     └─ Pro: 20 req/sec + volume discounts
│                                         │
└─────────────────────────────────────────┘
```

## Cryptocurrency Pair Mapping

```
TradeZone Symbol → Kraken Pair

BTC              → XBTUSDT (Bitcoin)
ETH              → ETHUSDT (Ethereum)
LTC              → LTCUSDT (Litecoin)
XRP              → XRPUSDT (Ripple)
ADA              → ADAUSDT (Cardano)
DOT              → DOTUSDT (Polkadot)
SOL              → SOLUSDT (Solana)
DOGE             → DOGEUSDT (Dogecoin)
MATIC            → MATICUSDT (Polygon)
LINK             → LINKUSDT (Chainlink)

(Others)         → {SYMBOL}USDT
```

## Error Handling Flow

```
Order Execution
    │
    ├─ Try: Call Kraken API
    │
    ├─ Catch Errors:
    │   ├─ EAPI:Invalid key
    │   │   └─ Log: Check KRAKEN_PUBLIC_KEY
    │   │
    │   ├─ EAPI:Invalid signature
    │   │   └─ Log: Check KRAKEN_PRIVATE_KEY or system clock
    │   │
    │   ├─ INSUFFICIENT FUNDS
    │   │   └─ Throw: "Insufficient balance"
    │   │
    │   ├─ Rate limit exceeded (429)
    │   │   └─ Queue: Retry with exponential backoff
    │   │
    │   └─ Network error
    │       └─ Fallback: Demo mode
    │
    └─ Finally: Update order status & wallets
```

## Performance Metrics

```
Typical Operation Times:

Kraken API Call:       200-500ms
├─ Network latency:    50-100ms
├─ Order matching:     50-200ms
└─ Response time:      50-200ms

Database Operations:   10-50ms
├─ Create order:       5-10ms
├─ Update balance:     5-10ms
└─ Create transaction: 5-10ms

Total Per Order:       210-550ms (Kraken)
                       10-50ms   (Wallet update)
```

---

**Created**: February 25, 2026
**Last Updated**: February 25, 2026
