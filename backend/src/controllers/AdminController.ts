import { Request, Response } from 'express';
import AdminService from '../services/AdminService';
import GeminiKYCService from '../services/GeminiKYCService';
import * as fs from 'fs';

export class AdminController {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getDashboardStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dashboard stats',
      });
    }
  }

  /**
   * Get pending KYC submissions
   */
  async getPendingKYC(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const submissions = await AdminService.getPendingKYCSubmissions(limit, offset);
      res.json({
        success: true,
        data: submissions,
      });
    } catch (error) {
      console.error('Error getting pending KYC:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get pending KYC',
      });
    }
  }

  /**
   * Approve KYC submission
   */
  async approveKYC(req: Request, res: Response): Promise<void> {
    try {
      const { kycId, notes } = req.body;
      const adminId = (req as any).userId; // From auth middleware

      if (!kycId) {
        res.status(400).json({
          success: false,
          error: 'KYC ID is required',
        });
        return;
      }

      await AdminService.approveKYC(kycId, adminId, notes || '');

      res.json({
        success: true,
        message: 'KYC approved successfully',
      });
    } catch (error) {
      console.error('Error approving KYC:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve KYC',
      });
    }
  }

  /**
   * Reject KYC submission
   */
  async rejectKYC(req: Request, res: Response): Promise<void> {
    try {
      const { kycId, reason, notes } = req.body;
      const adminId = (req as any).userId;

      if (!kycId || !reason) {
        res.status(400).json({
          success: false,
          error: 'KYC ID and reason are required',
        });
        return;
      }

      await AdminService.rejectKYC(kycId, adminId, reason, notes || '');

      res.json({
        success: true,
        message: 'KYC rejected successfully',
      });
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject KYC',
      });
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      const userDetails = await AdminService.getUserDetails(userId);

      res.json({
        success: true,
        data: userDetails,
      });
    } catch (error) {
      console.error('Error getting user details:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user details',
      });
    }
  }

  /**
   * Get activity logs
   */
  async getActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const logs = await AdminService.getUserActivityLogs(limit, offset);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error('Error getting activity logs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get activity logs',
      });
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await AdminService.getSystemHealth();

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      console.error('Error getting system health:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get system health',
      });
    }
  }

  /**
   * Get trading volume statistics
   */
  async getTradingVolume(req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getTradingVolumeStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting trading volume:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get trading volume',
      });
    }
  }

  /**
   * Get top traders
   */
  async getTopTraders(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const traders = await AdminService.getTopTraders(limit);

      res.json({
        success: true,
        data: traders,
      });
    } catch (error) {
      console.error('Error getting top traders:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get top traders',
      });
    }
  }

  /**
   * Get AI bot statistics
   */
  async getAIBotStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getAIBotStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting AI bot stats:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get AI bot stats',
      });
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, reason } = req.body;
      const adminId = (req as any).userId;

      if (!userId || !reason) {
        res.status(400).json({
          success: false,
          error: 'User ID and reason are required',
        });
        return;
      }

      await AdminService.suspendUser(userId, adminId, reason);

      res.json({
        success: true,
        message: 'User suspended successfully',
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to suspend user',
      });
    }
  }

  /**
   * Unsuspend user
   */
  async unsuspendUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const adminId = (req as any).userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      await AdminService.unsuspendUser(userId, adminId);

      res.json({
        success: true,
        message: 'User unsuspended successfully',
      });
    } catch (error) {
      console.error('Error unsuspending user:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unsuspend user',
      });
    }
  }

  /**
   * Re-analyze KYC with Gemini (Manual trigger)
   */
  async reanalyzeKYCWithGemini(req: Request, res: Response): Promise<void> {
    try {
      const { kycId, documentPath, selfiePath } = req.body;

      if (!kycId || !documentPath || !selfiePath) {
        res.status(400).json({
          success: false,
          error: 'KYC ID, document path, and selfie path are required',
        });
        return;
      }

      // Check if files exist
      if (!fs.existsSync(documentPath) || !fs.existsSync(selfiePath)) {
        res.status(400).json({
          success: false,
          error: 'One or more files do not exist',
        });
        return;
      }

      const analysis = await GeminiKYCService.performFullKYCVerification(
        documentPath,
        selfiePath,
        'ID_Document',
        '',
        '',
        '',
        ''
      );

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error('Error reanalyzing KYC:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reanalyze KYC',
      });
    }
  }
}

export default new AdminController();
