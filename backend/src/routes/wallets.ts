import express, { Router } from 'express';
import WalletController from '../controllers/WalletController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Wallet management
router.post('/create', WalletController.createWallet);
router.get('/list', WalletController.getWallets);
router.get('/:walletId', WalletController.getWallet);
router.post('/primary', WalletController.setPrimaryWallet);
router.delete('/delete', WalletController.deleteWallet);

// Send/Receive crypto
router.post('/send', WalletController.sendCrypto);
router.get('/:walletId/deposit-address', WalletController.getDepositAddress);

// Transaction management
router.get('/transactions/history', WalletController.getTransactionHistory);

// Balance & Limits
router.get('/balance/total', WalletController.getTotalBalance);
router.get('/limits/kyc', WalletController.getWalletLimits);

export default router;
