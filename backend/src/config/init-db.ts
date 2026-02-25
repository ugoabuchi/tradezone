import pool from './database';
import { runMigrations } from './migrations';

export const initializeDatabase = async () => {
  try {
    // Run migrations first
    console.log('Starting database initialization...');
    await runMigrations(pool);

    const client = await pool.connect();
    try {
      // MySQL does not support extensions; UUID() is built-in

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        kyc_status VARCHAR(20) DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'approved', 'rejected')),
        is_demo_user BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
    `);

    // Create wallets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        currency VARCHAR(10) NOT NULL,
        balance DECIMAL(20, 8) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, currency)
      );
      CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
    `);

    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
        price DECIMAL(20, 8) NOT NULL,
        quantity DECIMAL(20, 8) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        filled_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `);

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        from_currency VARCHAR(10) NOT NULL,
        to_currency VARCHAR(10) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        price DECIMAL(20, 8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    `);

    // Create KYC verification table
    await client.query(`
      CREATE TABLE IF NOT EXISTS kyc_verifications (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        country VARCHAR(100) NOT NULL,
        id_type VARCHAR(50) NOT NULL,
        id_number VARCHAR(255) NOT NULL,
        document_url VARCHAR(2048),
        address VARCHAR(500) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_verifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(status);
    `);

    // Create crypto wallet addresses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS crypto_wallet_addresses (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        blockchain VARCHAR(50) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        public_address VARCHAR(255) NOT NULL,
        private_key_encrypted TEXT,
        label VARCHAR(100),
        is_imported BOOLEAN DEFAULT false,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_addresses_user_id ON crypto_wallet_addresses(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_addresses_currency ON crypto_wallet_addresses(currency);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_primary ON crypto_wallet_addresses(user_id, currency) 
        WHERE is_primary = true;
    `);

    // Create trading accounts table (for futures, demo, copy trading)
    await client.query(`
      CREATE TABLE IF NOT EXISTS trading_accounts (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('spot', 'futures', 'demo', 'copy')),
        balance DECIMAL(20, 8) DEFAULT 0,
        leverage DECIMAL(3, 2) DEFAULT 1.00,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
    `);

    // Create copy trading relationships table
    await client.query(`
      CREATE TABLE IF NOT EXISTS copy_trades (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        follower_user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        leader_user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        allocation_percentage DECIMAL(5, 2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_copy_trades_follower ON copy_trades(follower_user_id);
      CREATE INDEX IF NOT EXISTS idx_copy_trades_leader ON copy_trades(leader_user_id);
    `);

    // Create futures positions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS futures_positions (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
        entry_price DECIMAL(20, 8) NOT NULL,
        current_price DECIMAL(20, 8) NOT NULL,
        quantity DECIMAL(20, 8) NOT NULL,
        leverage DECIMAL(3, 2) NOT NULL,
        stop_loss DECIMAL(20, 8),
        take_profit DECIMAL(20, 8),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
        pnl DECIMAL(20, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_futures_user_id ON futures_positions(user_id);
      CREATE INDEX IF NOT EXISTS idx_futures_symbol ON futures_positions(symbol);
    `);

    // Create stock trading table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_positions (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        quantity DECIMAL(20, 8) NOT NULL,
        average_price DECIMAL(20, 8) NOT NULL,
        current_price DECIMAL(20, 8) NOT NULL,
        status VARCHAR(20) DEFAULT 'holding' CHECK (status IN ('holding', 'sold')),
        pnl DECIMAL(20, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_stocks_user_id ON stock_positions(user_id);
      CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stock_positions(symbol);
    `);

    // Create NFT holdings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nft_holdings (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        contract_address VARCHAR(255) NOT NULL,
        token_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(2048),
        collection_name VARCHAR(255) NOT NULL,
        blockchain VARCHAR(50) NOT NULL,
        rarity_score DECIMAL(5, 2),
        acquired_price DECIMAL(20, 8),
        current_price DECIMAL(20, 8),
        status VARCHAR(20) DEFAULT 'holding' CHECK (status IN ('holding', 'listed', 'sold')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_nft_user_id ON nft_holdings(user_id);
      CREATE INDEX IF NOT EXISTS idx_nft_blockchain ON nft_holdings(blockchain);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_nft_unique ON nft_holdings(contract_address, token_id);
    `);

    // Create marketplace listings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        seller_user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        listing_type VARCHAR(50) NOT NULL CHECK (listing_type IN ('nft', 'product', 'service')),
        item_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        images JSON,
        price DECIMAL(20, 8) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        quantity INT DEFAULT 1,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
        views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_listings_seller ON marketplace_listings(seller_user_id);
      CREATE INDEX IF NOT EXISTS idx_listings_type ON marketplace_listings(listing_type);
      CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);
    `);

    // Create marketplace purchases/orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS marketplace_orders (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        buyer_user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        listing_id VARCHAR(36) REFERENCES marketplace_listings(id) ON DELETE SET NULL,
        seller_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
        item_id VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(20, 8) NOT NULL,
        total_amount DECIMAL(20, 8) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
        fulfillment_status VARCHAR(20) DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'shipped', 'delivered', 'cancelled')),
        shipping_address TEXT,
        tracking_number VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_user_id);
      CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_user_id);
      CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(payment_status);
    `);

    // Create AI trading bots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_trading_bots (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        bot_name VARCHAR(255) NOT NULL,
        strategy VARCHAR(100) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'paused')),
        initial_capital DECIMAL(20, 8) NOT NULL,
        current_balance DECIMAL(20, 8) NOT NULL,
        allocated_percentage DECIMAL(5, 2) NOT NULL,
        ai_model VARCHAR(50) NOT NULL CHECK (ai_model IN ('deepseek', 'gemini', 'hybrid')),
        risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
        trades_executed INT DEFAULT 0,
        total_return DECIMAL(10, 2) DEFAULT 0,
        win_rate DECIMAL(5, 2) DEFAULT 0,
        parameters JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ai_bots_user_id ON ai_trading_bots(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_bots_status ON ai_trading_bots(status);
    `);

    // Create AI trading history
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_trading_history (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        bot_id VARCHAR(36) REFERENCES ai_trading_bots(id) ON DELETE CASCADE,
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        action VARCHAR(10) NOT NULL CHECK (action IN ('buy', 'sell')),
        price DECIMAL(20, 8) NOT NULL,
        quantity DECIMAL(20, 8) NOT NULL,
        pnl DECIMAL(20, 8),
        confidence_score DECIMAL(5, 2),
        ai_reasoning TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ai_history_bot ON ai_trading_history(bot_id);
      CREATE INDEX IF NOT EXISTS idx_ai_history_user ON ai_trading_history(user_id);
    `);

    // Create KYC verifications table (enhanced)
    await client.query(`
      CREATE TABLE IF NOT EXISTS kyc_verifications (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'manual-review')),
        analysis_result JSON,
        document_url VARCHAR(500),
        selfie_url VARCHAR(500),
        full_name VARCHAR(255),
        date_of_birth DATE,
        address TEXT,
        phone_number VARCHAR(20),
        country VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_verifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(status);
    `);

    // Create admin actions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_actions (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        admin_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
        kyc_id VARCHAR(36) REFERENCES kyc_verifications(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
      CREATE INDEX IF NOT EXISTS idx_admin_actions_kyc ON admin_actions(kyc_id);
    `);

    // Create user activity logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_action ON user_activity_logs(action_type);
    `);

    // Create API logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INT,
        response_time INT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
      CREATE INDEX IF NOT EXISTS idx_api_logs_user ON api_logs(user_id);
    `);

    // Create error logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
        error_type VARCHAR(100) NOT NULL,
        error_message TEXT,
        stack_trace TEXT,
        endpoint VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
      CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
    `);

    // Create user sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500),
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
    `);

    // Add missing columns to users table if not exists
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned'));
      CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
    `);

    // Create crypto wallets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS crypto_wallets (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(255) NOT NULL,
        blockchain VARCHAR(50) NOT NULL,
        wallet_name VARCHAR(255) NOT NULL,
        encrypted_private_key TEXT NOT NULL,
        public_key VARCHAR(255),
        balance DECIMAL(20, 8) DEFAULT 0,
        is_primary BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user ON crypto_wallets(user_id);
      CREATE INDEX IF NOT EXISTS idx_crypto_wallets_blockchain ON crypto_wallets(blockchain);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_wallets_address ON crypto_wallets(wallet_address, blockchain);
    `);

    // Create crypto transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS crypto_transactions (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        from_wallet_id VARCHAR(36) REFERENCES crypto_wallets(id) ON DELETE SET NULL,
        to_address VARCHAR(255) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        fee DECIMAL(20, 8) DEFAULT 0,
        total_amount DECIMAL(20, 8) NOT NULL,
        currency VARCHAR(20) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
        transaction_hash VARCHAR(255),
        blockchain VARCHAR(50),
        confirmation INT DEFAULT 0,
        required_confirmations INT DEFAULT 1,
        kyc_level_required VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON crypto_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON crypto_transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON crypto_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_blockchain ON crypto_transactions(blockchain);
      CREATE INDEX IF NOT EXISTS idx_transactions_hash ON crypto_transactions(transaction_hash);
    `);

    // Create transaction limits tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_limits (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        daily_withdrawal_used DECIMAL(20, 2) DEFAULT 0,
        monthly_withdrawal_used DECIMAL(20, 2) DEFAULT 0,
        daily_deposit_used DECIMAL(20, 2) DEFAULT 0,
        monthly_deposit_used DECIMAL(20, 2) DEFAULT 0,
        reset_daily_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reset_monthly_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_limits_user ON transaction_limits(user_id);
    `);

    // Create wallet activity logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_activity_logs (
        id VARCHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        wallet_id VARCHAR(36) REFERENCES crypto_wallets(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        details JSON,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_wallet_logs_user ON wallet_activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_logs_wallet ON wallet_activity_logs(wallet_id);
    `);

    console.log('✓ Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
};

export default initializeDatabase;
