import { Request, Response } from 'express';
import CryptoWalletService from '../services/CryptoWalletService';

export class WalletController {
  /**
   * Create new crypto wallet
   */
  async createWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { walletName, blockchain, importPrivateKey } = req.body;
      const userPassword = (req as any).password || '';

      if (!walletName || !blockchain) {
        res.status(400).json({
          success: false,
          error: 'Wallet name and blockchain are required',
        });
        return;
      }

      const wallet = await CryptoWalletService.createWallet(
        userId,
        walletName,
        blockchain,
        userPassword,
        importPrivateKey
      );

      res.json({
        success: true,
        data: wallet,
        message: 'Wallet created successfully',
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create wallet',
      });
    }
  }

  /**
   * Get all wallets for user
   */
  async getWallets(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      const wallets = await CryptoWalletService.getWallets(userId);

      res.json({
        success: true,
        data: wallets,
        count: wallets.length,
      });
    } catch (error) {
      console.error('Error getting wallets:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get wallets',
      });
    }
  }

  /**
   * Get wallet details
   */
  async getWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { walletId } = req.params;

      const wallet = await CryptoWalletService.getWallet(walletId, userId);

      res.json({
        success: true,
        data: wallet,
      });
    } catch (error) {
      console.error('Error getting wallet:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get wallet',
      });
    }
  }

  /**
   * Send crypto
   */
  async sendCrypto(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { fromWalletId, toAddress, amount, password } = req.body;

      if (!fromWalletId || !toAddress || !amount) {
        res.status(400).json({
          success: false,
          error: 'Wallet ID, destination address, and amount are required',
        });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0',
        });
        return;
      }

      const transaction = await CryptoWalletService.sendCrypto(
        userId,
        fromWalletId,
        toAddress,
        amount,
        password || ''
      );

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction submitted successfully',
      });
    } catch (error) {
      console.error('Error sending crypto:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send crypto',
      });
    }
  }

  /**
   * Get deposit address
   */
  async getDepositAddress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { walletId } = req.params;

      const address = await CryptoWalletService.getDepositAddress(userId, walletId);

      res.json({
        success: true,
        data: {
          walletId,
          depositAddress: address,
          message: 'Send crypto to this address to deposit',
        },
      });
    } catch (error) {
      console.error('Error getting deposit address:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deposit address',
      });
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await CryptoWalletService.getTransactionHistory(userId, limit, offset);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length,
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transaction history',
      });
    }
  }

  /**
   * Get total balance
   */
  async getTotalBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      const balance = await CryptoWalletService.getTotalBalance(userId);

      res.json({
        success: true,
        data: {
          totalBalance: balance,
          currency: 'USD',
        },
      });
    } catch (error) {
      console.error('Error getting total balance:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get total balance',
      });
    }
  }

  /**
   * Set primary wallet
   */
  async setPrimaryWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { walletId } = req.body;

      if (!walletId) {
        res.status(400).json({
          success: false,
          error: 'Wallet ID is required',
        });
        return;
      }

      await CryptoWalletService.setPrimaryWallet(userId, walletId);

      res.json({
        success: true,
        message: 'Primary wallet updated successfully',
      });
    } catch (error) {
      console.error('Error setting primary wallet:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set primary wallet',
      });
    }
  }

  /**
   * Delete wallet
   */
  async deleteWallet(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { walletId } = req.body;

      if (!walletId) {
        res.status(400).json({
          success: false,
          error: 'Wallet ID is required',
        });
        return;
      }

      await CryptoWalletService.deleteWallet(userId, walletId);

      res.json({
        success: true,
        message: 'Wallet deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting wallet:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete wallet',
      });
    }
  }

  /**
   * Get wallet KYC limits
   */
  async getWalletLimits(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      const userResult = await (await import('../config/database')).query(
        'SELECT kyc_status FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const { KYC_LIMITS } = await import('../utils/walletUtils');
      const kycStatus = userResult.rows[0].kyc_status;
      const limits = KYC_LIMITS[kycStatus];

      res.json({
        success: true,
        data: {
          kycStatus,
          limits,
          message: `Your current KYC level is ${kycStatus}`,
        },
      });
    } catch (error) {
      console.error('Error getting wallet limits:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get wallet limits',
      });
    }
  }
}

export default new WalletController();
