import express, { Router } from 'express';
import AdminController from '../controllers/AdminController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Dashboard statistics
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/system-health', AdminController.getSystemHealth);
router.get('/dashboard/trading-volume', AdminController.getTradingVolume);
router.get('/dashboard/top-traders', AdminController.getTopTraders);
router.get('/dashboard/ai-bots', AdminController.getAIBotStats);

// KYC Management
router.get('/kyc/pending', AdminController.getPendingKYC);
router.post('/kyc/approve', AdminController.approveKYC);
router.post('/kyc/reject', AdminController.rejectKYC);
router.post('/kyc/reanalyze', AdminController.reanalyzeKYCWithGemini);

// User Management
router.get('/users/:userId', AdminController.getUserDetails);
router.post('/users/suspend', AdminController.suspendUser);
router.post('/users/unsuspend', AdminController.unsuspendUser);

// Activity Logs
router.get('/activity-logs', AdminController.getActivityLogs);

export default router;
