import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import {
  generateWallet,
  encryptPrivateKey,
  decryptPrivateKey,
  validateAddress,
  getNetworkFees,
  KYCLevel,
  KYC_LIMITS,
} from '../utils/walletUtils';

export interface CryptoWallet {
  id: string;
  userId: string;
  walletAddress: string;
  blockchain: string;
  balance: number;
  walletName: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  fromWalletId: string;
  toAddress: string;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  type: string;
  status: string;
  transactionHash: string;
  confirmation: number;
  requiredConfirmations: number;
  kycLevelRequired: string;
  createdAt: string;
  completedAt?: string;
}

export class CryptoWalletService {
  /**
   * Create a new crypto wallet
   */
  async createWallet(
    userId: string,
    walletName: string,
    blockchain: string,
    userPassword: string,
    importPrivateKey?: string
  ): Promise<CryptoWallet> {
    try {
      // Verify user KYC status
      const userResult = await query('SELECT kyc_status FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const kycStatus = userResult.rows[0].kyc_status;
      const limits = KYC_LIMITS[kycStatus as KYCLevel];

      if (!limits.canDeposit) {
        throw new Error(`KYC level ${kycStatus} is not eligible to create wallets`);
      }

      // Generate or import wallet
      let walletData;
      if (importPrivateKey) {
        // Validate imported private key
        if (!importPrivateKey.match(/^[a-fA-F0-9]{64}$/)) {
          throw new Error('Invalid private key format');
        }
        walletData = {
          privateKey: importPrivateKey,
          address: this.deriveAddressFromPrivateKey(importPrivateKey, blockchain),
          publicKey: '', // Would derive from private key in production
        };
      } else {
        // Generate new wallet
        walletData = generateWallet(blockchain);
      }

      // Encrypt private key with user password
      const encryptedPrivateKey = encryptPrivateKey(walletData.privateKey, userPassword);

      // Save wallet to database
      const walletId = uuidv4();
      const isPrimary = (
        await query('SELECT COUNT(*) as count FROM crypto_wallets WHERE user_id = $1', [userId])
      ).rows[0].count === 0;

      await query(
        `INSERT INTO crypto_wallets 
         (id, user_id, wallet_address, blockchain, wallet_name, encrypted_private_key, 
          public_key, balance, is_primary, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          walletId,
          userId,
          walletData.address,
          blockchain,
          walletName,
          encryptedPrivateKey,
          walletData.publicKey || '',
          0, // Initial balance
          isPrimary,
          true,
        ]
      );

      return {
        id: walletId,
        userId,
        walletAddress: walletData.address,
        blockchain,
        balance: 0,
        walletName,
        isPrimary,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  /**
   * Get all wallets for user
   */
  async getWallets(userId: string): Promise<CryptoWallet[]> {
    try {
      const result = await query(
        `SELECT id, user_id, wallet_address, blockchain, balance, wallet_name, 
                is_primary, is_active, created_at, updated_at
         FROM crypto_wallets
         WHERE user_id = $1 AND is_active = true
         ORDER BY is_primary DESC, created_at DESC`,
        [userId]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        walletAddress: row.wallet_address,
        blockchain: row.blockchain,
        balance: parseFloat(row.balance),
        walletName: row.wallet_name,
        isPrimary: row.is_primary,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error getting wallets:', error);
      throw error;
    }
  }

  /**
   * Get single wallet details
   */
  async getWallet(walletId: string, userId: string): Promise<CryptoWallet> {
    try {
      const result = await query(
        `SELECT id, user_id, wallet_address, blockchain, balance, wallet_name, 
                is_primary, is_active, created_at, updated_at
         FROM crypto_wallets
         WHERE id = $1 AND user_id = $2`,
        [walletId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        walletAddress: row.wallet_address,
        blockchain: row.blockchain,
        balance: parseFloat(row.balance),
        walletName: row.wallet_name,
        isPrimary: row.is_primary,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error getting wallet:', error);
      throw error;
    }
  }

  /**
   * Send crypto to another address
   */
  async sendCrypto(
    userId: string,
    fromWalletId: string,
    toAddress: string,
    amount: number,
    userPassword: string
  ): Promise<TransactionRecord> {
    try {
      await query('BEGIN');

      // Get wallet
      const walletResult = await query(
        `SELECT * FROM crypto_wallets WHERE id = $1 AND user_id = $2`,
        [fromWalletId, userId]
      );

      if (walletResult.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      const wallet = walletResult.rows[0];

      // Validate address
      if (!validateAddress(toAddress, wallet.blockchain)) {
        throw new Error(`Invalid ${wallet.blockchain} address format`);
      }

      // Check balance
      if (parseFloat(wallet.balance) < amount) {
        throw new Error('Insufficient balance');
      }

      // Get user KYC limits
      const userResult = await query('SELECT kyc_status FROM users WHERE id = $1', [userId]);
      const kycStatus = userResult.rows[0].kyc_status as KYCLevel;
      const limits = KYC_LIMITS[kycStatus];

      if (!limits.canWithdraw) {
        throw new Error(`KYC level ${kycStatus} cannot perform withdrawals`);
      }

      if (amount > limits.maxTransactionAmount) {
        throw new Error(`Transaction exceeds maximum amount of ${limits.maxTransactionAmount}`);
      }

      // Check daily/monthly limits
      const dailyUsed = await this.getDailyWithdrawalUsed(userId);
      const monthlyUsed = await this.getMonthlyWithdrawalUsed(userId);

      if (dailyUsed + amount > limits.dailyWithdrawalLimit) {
        throw new Error(
          `Daily withdrawal limit exceeded. Used: ${dailyUsed}, Limit: ${limits.dailyWithdrawalLimit}`
        );
      }

      if (monthlyUsed + amount > limits.monthlyWithdrawalLimit) {
        throw new Error(
          `Monthly withdrawal limit exceeded. Used: ${monthlyUsed}, Limit: ${limits.monthlyWithdrawalLimit}`
        );
      }

      // Calculate fee
      const fee = getNetworkFees(wallet.blockchain, amount);
      const totalAmount = amount + fee;

      // Create transaction record
      const transactionId = uuidv4();
      const result = await query(
        `INSERT INTO crypto_transactions
         (id, user_id, from_wallet_id, to_address, amount, fee, total_amount, 
          currency, type, status, blockchain, kyc_level_required, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
         RETURNING *`,
        [
          transactionId,
          userId,
          fromWalletId,
          toAddress,
          amount,
          fee,
          totalAmount,
          wallet.blockchain.toUpperCase(),
          'withdrawal',
          'pending',
          wallet.blockchain,
          kycStatus,
        ]
      );

      // Deduct from wallet balance
      await query(
        `UPDATE crypto_wallets SET balance = balance - $1, updated_at = NOW() 
         WHERE id = $2`,
        [totalAmount, fromWalletId]
      );

      await query('COMMIT');

      const txRecord = result.rows[0];
      return {
        id: txRecord.id,
        userId: txRecord.user_id,
        fromWalletId: txRecord.from_wallet_id,
        toAddress: txRecord.to_address,
        amount: parseFloat(txRecord.amount),
        fee: parseFloat(txRecord.fee),
        totalAmount: parseFloat(txRecord.total_amount),
        currency: txRecord.currency,
        type: txRecord.type,
        status: txRecord.status,
        transactionHash: txRecord.transaction_hash || '',
        confirmation: 0,
        requiredConfirmations: this.getRequiredConfirmations(wallet.blockchain),
        kycLevelRequired: txRecord.kyc_level_required,
        createdAt: txRecord.created_at,
      };
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error sending crypto:', error);
      throw error;
    }
  }

  /**
   * Receive crypto (generate deposit address)
   */
  async getDepositAddress(userId: string, walletId: string): Promise<string> {
    try {
      const result = await query(
        `SELECT wallet_address FROM crypto_wallets WHERE id = $1 AND user_id = $2`,
        [walletId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      return result.rows[0].wallet_address;
    } catch (error) {
      console.error('Error getting deposit address:', error);
      throw error;
    }
  }

  /**
   * Record incoming deposit
   */
  async recordDeposit(
    userId: string,
    walletId: string,
    amount: number,
    transactionHash: string,
    blockchainType: string
  ): Promise<TransactionRecord> {
    try {
      await query('BEGIN');

      const transactionId = uuidv4();

      // Create transaction record
      const result = await query(
        `INSERT INTO crypto_transactions
         (id, user_id, from_wallet_id, to_address, amount, fee, total_amount,
          currency, type, status, transaction_hash, blockchain, kyc_level_required, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
         RETURNING *`,
        [
          transactionId,
          userId,
          walletId,
          '', // No specific to address for deposits
          amount,
          0, // No fee for deposits
          amount,
          blockchainType.toUpperCase(),
          'deposit',
          'confirmed',
          transactionHash,
          blockchainType,
          'unverified',
        ]
      );

      // Add to wallet balance
      await query(
        `UPDATE crypto_wallets SET balance = balance + $1, updated_at = NOW() 
         WHERE id = $2`,
        [amount, walletId]
      );

      await query('COMMIT');

      const txRecord = result.rows[0];
      return {
        id: txRecord.id,
        userId: txRecord.user_id,
        fromWalletId: txRecord.from_wallet_id,
        toAddress: txRecord.to_address,
        amount: parseFloat(txRecord.amount),
        fee: parseFloat(txRecord.fee),
        totalAmount: parseFloat(txRecord.total_amount),
        currency: txRecord.currency,
        type: txRecord.type,
        status: txRecord.status,
        transactionHash: txRecord.transaction_hash,
        confirmation: 1,
        requiredConfirmations: this.getRequiredConfirmations(blockchainType),
        kycLevelRequired: txRecord.kyc_level_required,
        createdAt: txRecord.created_at,
        completedAt: txRecord.created_at,
      };
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error recording deposit:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit = 50, offset = 0): Promise<TransactionRecord[]> {
    try {
      const result = await query(
        `SELECT * FROM crypto_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        fromWalletId: row.from_wallet_id,
        toAddress: row.to_address,
        amount: parseFloat(row.amount),
        fee: parseFloat(row.fee),
        totalAmount: parseFloat(row.total_amount),
        currency: row.currency,
        type: row.type,
        status: row.status,
        transactionHash: row.transaction_hash,
        confirmation: row.confirmation || 0,
        requiredConfirmations: row.required_confirmations || 1,
        kycLevelRequired: row.kyc_level_required,
        createdAt: row.created_at,
        completedAt: row.completed_at,
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Get total balance across all wallets
   */
  async getTotalBalance(userId: string): Promise<number> {
    try {
      const result = await query(
        `SELECT COALESCE(SUM(balance), 0) as total FROM crypto_wallets 
         WHERE user_id = $1 AND is_active = true`,
        [userId]
      );

      return parseFloat(result.rows[0].total);
    } catch (error) {
      console.error('Error getting total balance:', error);
      throw error;
    }
  }

  /**
   * Set primary wallet
   */
  async setPrimaryWallet(userId: string, walletId: string): Promise<void> {
    try {
      await query('BEGIN');

      // Remove primary from all user wallets
      await query(
        `UPDATE crypto_wallets SET is_primary = false WHERE user_id = $1`,
        [userId]
      );

      // Set new primary
      await query(
        `UPDATE crypto_wallets SET is_primary = true WHERE id = $1 AND user_id = $2`,
        [walletId, userId]
      );

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error setting primary wallet:', error);
      throw error;
    }
  }

  /**
   * Delete wallet
   */
  async deleteWallet(userId: string, walletId: string): Promise<void> {
    try {
      // Check if wallet has balance
      const result = await query(
        `SELECT balance, is_primary FROM crypto_wallets WHERE id = $1 AND user_id = $2`,
        [walletId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      if (parseFloat(result.rows[0].balance) > 0) {
        throw new Error('Cannot delete wallet with balance. Withdraw funds first.');
      }

      if (result.rows[0].is_primary) {
        throw new Error('Cannot delete primary wallet');
      }

      await query(
        `UPDATE crypto_wallets SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [walletId]
      );
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }

  /**
   * Helper: Get daily withdrawal used
   */
  private async getDailyWithdrawalUsed(userId: string): Promise<number> {
    const result = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM crypto_transactions
       WHERE user_id = $1 AND type = 'withdrawal' 
       AND status IN ('confirmed', 'pending')
       AND DATE(created_at) = CURRENT_DATE`,
      [userId]
    );
    return parseFloat(result.rows[0].total);
  }

  /**
   * Helper: Get monthly withdrawal used
   */
  private async getMonthlyWithdrawalUsed(userId: string): Promise<number> {
    const result = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM crypto_transactions
       WHERE user_id = $1 AND type = 'withdrawal'
       AND status IN ('confirmed', 'pending')
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_TIMESTAMP)`,
      [userId]
    );
    return parseFloat(result.rows[0].total);
  }

  /**
   * Helper: Get required confirmations for blockchain
   */
  private getRequiredConfirmations(blockchain: string): number {
    const confirmations: Record<string, number> = {
      ethereum: 12,
      polygon: 128,
      bsc: 20,
      bitcoin: 6,
      solana: 1,
    };
    return confirmations[blockchain] || 1;
  }

  /**
   * Helper: Derive address from private key
   */
  private deriveAddressFromPrivateKey(privateKey: string, blockchain: string): string {
    // Simplified - in production use ethers.js or similar
    if (blockchain === 'ethereum' || blockchain === 'polygon' || blockchain === 'bsc') {
      // EVM address derivation
      return '0x' + privateKey.slice(0, 40); // Placeholder
    }
    return privateKey.slice(0, 44); // Placeholder
  }
}

export default new CryptoWalletService();
