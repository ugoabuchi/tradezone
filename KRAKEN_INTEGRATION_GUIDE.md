# Kraken API Integration Guide

This document provides detailed instructions for integrating your TradeZone application with Kraken.com's cryptocurrency exchange API.

## Overview

TradeZone now supports **Kraken.com** as the primary exchange provider for all cryptocurrency trading. All buy/sell orders are automatically routed to Kraken's API when credentials are properly configured.

## Setting Up Kraken API Keys

### Step 1: Create a Kraken Account
1. Go to [https://www.kraken.com](https://www.kraken.com)
2. Sign up for an account if you don't have one
3. Complete the KYC (Know Your Customer) verification process
4. Enable 2FA (Two-Factor Authentication) for added security

### Step 2: Generate API Keys
1. Log in to your Kraken account
2. Navigate to **Settings** → **API**
3. Click **Generate New Key**
4. Name your key (e.g., "TradeZone-Trading")
5. Choose API Access Tier:
   - **Starter**: Free tier, lower rate limits
   - **Intermediate**: Higher rate limits (recommended for active trading)
   - **Pro**: Highest rate limits

### Step 3: Configure Permissions
Select the following permissions for your API key:
- ✅ `Query Funds` - View your account balance
- ✅ `Query Open Orders & Trades` - See your open orders
- ✅ `Query Closed Orders & Trades` - View order history
- ✅ `Create & Modify Orders` - Place buy/sell orders
- ✅ `Cancel/Close Orders` - Cancel existing orders

⚠️ **Security Tip**: Do NOT enable `Withdraw Funds` or `Request Query Account` unless absolutely necessary.

### Step 4: Set API Key Restrictions
1. **IP Whitelist** (Recommended):
   - Add your server's IP address to restrict API access
   - Only requests from whitelisted IPs can use the key

2. **Rate Limiting**:
   - Set appropriate rate limits based on your trading volume
   - Monitor usage to avoid hitting limits

## Environmental Configuration

### Add Credentials to `.env` File

In your `backend/.env` file, add your Kraken API credentials:

```bash
# Kraken Exchange API Configuration
KRAKEN_API_URL=https://api.kraken.com
KRAKEN_PUBLIC_KEY=your-kraken-api-public-key-here
KRAKEN_PRIVATE_KEY=your-kraken-api-private-key-here
KRAKEN_API_TIER=starter  # Options: starter, intermediate, pro
```

### How to Get Your Keys

1. **Public Key (API Key)**:
   - Go to Settings → API → Generated Key
   - Copy the "Key" value (usually starts with numbers/letters)
   - Paste into `KRAKEN_PUBLIC_KEY`

2. **Private Key (API Sign)**:
   - Go to Settings → API → Generated Key
   - Copy the "Private Key" value (it's hidden by default, click to reveal)
   - Paste into `KRAKEN_PRIVATE_KEY`

⚠️ **Never share or expose these keys in version control or logs!**

## Trading API Endpoints Used

TradeZone integrates with the following Kraken API endpoints:

### Public Endpoints (No Authentication Required)
- `GET /0/public/Assets` - Get available cryptocurrencies
- `GET /0/public/AssetPairs` - Get trading pairs information
- `GET /0/public/Ticker` - Get current ticker data
- `GET /0/public/OHLC` - Get candlestick data
- `GET /0/public/Depth` - Get order book
- `GET /0/public/Trades` - Get recent trades
- `GET /0/public/Spread` - Get spread data

### Private Endpoints (Authentication Required)
- `GET /0/private/Balance` - Get account balance
- `GET /0/private/OpenOrders` - Get open orders
- `GET /0/private/ClosedOrders` - Get closed order history
- `POST /0/private/AddOrder` - Place buy/sell orders
- `POST /0/private/CancelOrder` - Cancel orders
- `GET /0/private/QueryOrders` - Get specific order details

## Trading Pair Format

Kraken uses specific pair naming conventions. Common mappings:

| Symbol | Kraken Pair | Description |
|--------|-------------|-------------|
| BTC    | XBTUSDT     | Bitcoin / USD Tether |
| ETH    | ETHUSDT     | Ethereum / USD Tether |
| LTC    | LTCUSDT     | Litecoin / USD Tether |
| XRP    | XRPUSDT     | Ripple / USD Tether |
| ADA    | ADAUSDT     | Cardano / USD Tether |
| DOT    | DOTUSDT     | Polkadot / USD Tether |
| SOL    | SOLUSDT     | Solana / USD Tether |

For other trading pairs, the format is: `{SYMBOL}USDT` or `{SYMBOL}USD`

## Error Handling

When trading without Kraken credentials configured:
- Orders are processed in **Demo Mode**
- Balances are updated locally
- You'll see a warning: `⚠️ Kraken API not configured. Using demo mode.`

To enable real trading:
1. Ensure `KRAKEN_PUBLIC_KEY` and `KRAKEN_PRIVATE_KEY` are set in `.env`
2. Restart the backend server
3. Check console logs for `✅ Order submitted to Kraken`

## Rate Limits

Kraken has different rate limits based on your API tier:

| Tier | Requests/Second | Max Burst |
|------|---|---|
| Starter | 15 | 20 |
| Intermediate | 20 | 30 |
| Pro | 20 | 30 |

The application includes automatic rate limit handling. If you exceed limits:
- Kraken will return a 429 error
- The system will retry with exponential backoff
- Check `KRAKEN_API_TIER` in your `.env`

## Fee Structure

Kraken's standard trading fees:
- **Maker Fee**: 0.16% (provides liquidity)
- **Taker Fee**: 0.26% (removes liquidity)
- Fees decrease with higher trading volumes

Fees are deducted automatically by Kraken when orders are executed.

## Testing Your Integration

### Test with Demo Mode
```bash
# Remove KRAKEN_PUBLIC_KEY and KRAKEN_PRIVATE_KEY from .env
# Restart the server
# Place a test order - it will execute in demo mode
```

### Test with Real Kraken API
```bash
# Add KRAKEN_PUBLIC_KEY and KRAKEN_PRIVATE_KEY to .env
# Ensure your API key has the required permissions
# Restart the server
# Check console logs for Kraken order execution
```

## Monitoring Orders

You can monitor all orders in Kraken:
1. Open your Kraken account dashboard
2. Go to **History** → **Orders**
3. Orders placed by TradeZone will appear here with status:
   - `pending` - Awaiting execution
   - `open` - Order is active
   - `closed` - Order completed
   - `cancelled` - Order was canceled

## Security Best Practices

1. **Rotate API Keys Regularly**
   - Generate new keys monthly or quarterly
   - Delete old keys to prevent unauthorized access

2. **Enable 2FA**
   - Use authenticator app (Google Authenticator, Authy)
   - 2FA is required to modify API keys

3. **Use IP Whitelisting**
   - Only allow your server's IP address
   - Update if your server IP changes

4. **Monitor API Activity**
   - Check Kraken's API usage logs
   - Alert on unusual trading activity

5. **Keep Credentials Secure**
   - Never commit `.env` files to Git
   - Use environment variable management tools
   - Restrict file permissions: `chmod 600 .env`

## Troubleshooting

### "Kraken API Error: EAPI:Invalid key"
- Check that `KRAKEN_PUBLIC_KEY` is correctly copied
- Ensure no extra spaces or line breaks

### "Kraken API Error: EAPI:Invalid signature"
- Verify `KRAKEN_PRIVATE_KEY` is correctly base64-encoded
- Check that your system clock is synchronized (nonce validation)

### Orders not executing on Kraken
- Check if API key has "Create & Modify Orders" permission
- Verify you have sufficient balance
- Check rate limits haven't been exceeded

### "INSUFFICIENT FUNDS"
- Ensure account has actual funds in Kraken (not just local wallet)
- Account balance includes trading fees

## Support & Resources

- **Kraken API Documentation**: https://docs.kraken.com/rest/
- **Kraken Support**: https://support.kraken.com
- **API Status**: https://status.kraken.com

## Next Steps

1. ✅ Generate Kraken API keys
2. ✅ Add keys to `backend/.env`
3. ✅ Restart the backend server
4. ✅ Place a test order
5. ✅ Monitor order on Kraken dashboard
6. ✅ Set up alerts for trading activity

---

**Last Updated**: February 25, 2026
**Version**: 1.0
