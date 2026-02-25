import { Request, Response } from 'express';
import * as KYCService from '../services/KYCService';
import * as WalletService from '../services/CryptoWalletService';

export const submitKYC = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { recaptchaToken, ...kycData } = req.body;

    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token required' });
    }

    const kyc = await KYCService.submitKYC(userId, kycData, recaptchaToken);
    res.json(kyc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getKYCStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = await KYCService.getKYCStatus(userId);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createWalletAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { blockchain, currency, publicAddress, privateKeyEncrypted, label, isImported } = req.body;

    const wallet = await WalletService.createWalletAddress(userId, {
      blockchain,
      currency,
      publicAddress,
      privateKeyEncrypted,
      label,
      isImported,
    });

    res.json(wallet);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getWalletAddresses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const wallets = await WalletService.getWalletAddressesByUser(userId);
    res.json(wallets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const generateWalletAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currency, blockchain, label } = req.body;

    const wallet = await WalletService.generateNewWallet(userId, currency, blockchain, label);
    res.json(wallet);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const setPrimaryWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { walletId, currency } = req.body;

    const wallet = await WalletService.setPrimaryWallet(userId, currency, walletId);
    res.json(wallet);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { walletId } = req.params;

    await WalletService.deleteWalletAddress(userId, walletId);
    res.json({ message: 'Wallet deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getPendingKYC = async (req: Request, res: Response) => {
  try {
    // This should be admin-only
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Add admin role check
    const pending = await KYCService.getPendingKYCVerifications();
    res.json(pending);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const approveKYC = async (req: Request, res: Response) => {
  try {
    const { kycId } = req.params;
    const kyc = await KYCService.approveKYC(kycId);
    res.json(kyc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectKYC = async (req: Request, res: Response) => {
  try {
    const { kycId } = req.params;
    const { reason } = req.body;
    const kyc = await KYCService.rejectKYC(kycId, reason);
    res.json(kyc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
