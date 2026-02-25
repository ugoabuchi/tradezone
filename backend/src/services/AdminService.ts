import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  pendingKYC: number;
  approvedKYC: number;
  rejectedKYC: number;
  activeTraders: number;
  totalTrades: number;
  totalTransactionValue: number;
}

export interface PendingKYCSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  documentType: string;
  analysisResult: any;
}

export interface UserActivityLog {
  userId: string;
  userEmail: string;
  action: string;
  actionType: 'login' | 'trade' | 'kyc_submit' | 'withdrawal' | 'deposit';
  timestamp: string;
  details: string;
}

export interface AdminAction {
  id: string;
  kycId: string;
  administration: 'approved' | 'rejected' | 'pending';
  reason: string;
  adminNotes: string;
  actionTime: string;
}

export class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Total users
      const usersResult = await query('SELECT COUNT(*) as count FROM users');
      const totalUsers = parseInt(usersResult.rows[0]?.count || '0');

      // KYC stats
      const kycResult = await query(
        'SELECT status, COUNT(*) as count FROM kyc_verifications GROUP BY status'
      );
      let pendingKYC = 0,
        approvedKYC = 0,
        rejectedKYC = 0;
      kycResult.rows.forEach((row: any) => {
        if (row.status === 'pending') pendingKYC = parseInt(row.count);
        else if (row.status === 'approved') approvedKYC = parseInt(row.count);
        else if (row.status === 'rejected') rejectedKYC = parseInt(row.count);
      });

      // Active traders (users with trades in last 30 days)
      const activeResult = await query(
        `SELECT COUNT(DISTINCT user_id) as count FROM orders 
         WHERE created_at > NOW() - INTERVAL '30 days'`
      );
      const activeTraders = parseInt(activeResult.rows[0]?.count || '0');

      // Total trades
      const tradesResult = await query('SELECT COUNT(*) as count FROM orders');
      const totalTrades = parseInt(tradesResult.rows[0]?.count || '0');

      // Total transaction value (sum of all order values)
      const transactionResult = await query(
        `SELECT COALESCE(SUM(quantity * price), 0) as total FROM orders 
         WHERE status = 'filled'`
      );
      const totalTransactionValue = parseFloat(transactionResult.rows[0]?.total || '0');

      // Total revenue (from trading fees - estimate 0.1% of transaction value)
      const totalRevenue = totalTransactionValue * 0.001;

      return {
        totalUsers,
        totalRevenue,
        pendingKYC,
        approvedKYC,
        rejectedKYC,
        activeTraders,
        totalTrades,
        totalTransactionValue,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get pending KYC submissions
   */
  async getPendingKYCSubmissions(limit = 20, offset = 0): Promise<PendingKYCSubmission[]> {
    try {
      const result = await query(
        `SELECT 
          k.id, 
          k.user_id,
          u.email as userEmail,
          u.full_name as userFullName,
          k.created_at as submittedAt,
          k.status,
          k.document_type as documentType,
          k.analysis_result as analysisResult
         FROM kyc_verifications k
         JOIN users u ON k.user_id = u.id
         WHERE k.status = 'pending'
         ORDER BY k.created_at ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.useremail,
        userFullName: row.userfullname,
        submittedAt: row.submittedat,
        status: row.status,
        documentType: row.documenttype,
        analysisResult: row.analysisresult,
      }));
    } catch (error) {
      console.error('Error getting pending KYC submissions:', error);
      throw error;
    }
  }

  /**
   * Approve KYC submission
   */
  async approveKYC(kycId: string, adminId: string, notes: string): Promise<void> {
    try {
      await query('BEGIN');

      // Update KYC status
      await query(
        `UPDATE kyc_verifications 
         SET status = 'approved', updated_at = NOW()
         WHERE id = $1`,
        [kycId]
      );

      // Get user ID from KYC record
      const kycResult = await query(
        'SELECT user_id FROM kyc_verifications WHERE id = $1',
        [kycId]
      );
      const userId = kycResult.rows[0]?.user_id;

      // Update user KYC status
      if (userId) {
        await query(
          `UPDATE users 
           SET kyc_status = 'verified', updated_at = NOW()
           WHERE id = $1`,
          [userId]
        );
      }

      // Log admin action
      await query(
        `INSERT INTO admin_actions (id, kyc_id, admin_id, action, reason, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [uuidv4(), kycId, adminId, 'approved', 'Manual approval', notes]
      );

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error approving KYC:', error);
      throw error;
    }
  }

  /**
   * Reject KYC submission
   */
  async rejectKYC(kycId: string, adminId: string, reason: string, notes: string): Promise<void> {
    try {
      await query('BEGIN');

      // Update KYC status
      await query(
        `UPDATE kyc_verifications 
         SET status = 'rejected', updated_at = NOW()
         WHERE id = $1`,
        [kycId]
      );

      // Get user ID
      const kycResult = await query(
        'SELECT user_id FROM kyc_verifications WHERE id = $1',
        [kycId]
      );
      const userId = kycResult.rows[0]?.user_id;

      // Update user KYC status
      if (userId) {
        await query(
          `UPDATE users 
           SET kyc_status = 'rejected', updated_at = NOW()
           WHERE id = $1`,
          [userId]
        );
      }

      // Log admin action
      await query(
        `INSERT INTO admin_actions (id, kyc_id, admin_id, action, reason, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [uuidv4(), kycId, adminId, 'rejected', reason, notes]
      );

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error rejecting KYC:', error);
      throw error;
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string): Promise<any> {
    try {
      const userResult = await query(
        `SELECT id, email, full_name, kyc_status, created_at 
         FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Get user's KYC status
      const kycResult = await query(
        'SELECT * FROM kyc_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      // Get user's wallets
      const walletsResult = await query(
        'SELECT * FROM wallets WHERE user_id = $1',
        [userId]
      );

      // Get user's recent trades
      const tradesResult = await query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
        [userId]
      );

      return {
        user,
        kyc: kycResult.rows[0] || null,
        wallets: walletsResult.rows,
        recentTrades: tradesResult.rows,
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(limit = 50, offset = 0): Promise<UserActivityLog[]> {
    try {
      const result = await query(
        `SELECT 
          user_id as userId,
          action,
          action_type as actionType,
          created_at as timestamp,
          details
         FROM user_activity_logs
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting activity logs:', error);
      throw error;
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<any> {
    try {
      // Check database connection
      const dbCheck = await query('SELECT NOW()');
      const dbHealth = dbCheck.rows.length > 0;

      // Get API performance (average response time from logs)
      const performanceResult = await query(
        `SELECT AVG(response_time) as avgResponseTime 
         FROM api_logs WHERE created_at > NOW() - INTERVAL '1 hour'`
      );
      const avgResponseTime = parseFloat(performanceResult.rows[0]?.avgresponsetime || '0');

      // Get error rate
      const errorResult = await query(
        `SELECT COUNT(*) as errorCount FROM error_logs 
         WHERE created_at > NOW() - INTERVAL '1 hour'`
      );
      const errorCount = parseInt(errorResult.rows[0]?.errorcount || '0');

      // Get active sessions
      const sessionsResult = await query(
        'SELECT COUNT(*) as activeSessionCount FROM user_sessions WHERE expires_at > NOW()'
      );
      const activeSessions = parseInt(sessionsResult.rows[0]?.activesessioncount || '0');

      return {
        database: dbHealth ? 'healthy' : 'unhealthy',
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        recentErrors: errorCount,
        activeSessions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        database: 'unhealthy',
        avgResponseTime: 'N/A',
        recentErrors: 'N/A',
        activeSessions: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get trading volume statistics
   */
  async getTradingVolumeStats(): Promise<any> {
    try {
      const result = await query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as tradeCount,
          SUM(quantity * price) as totalVolume,
          AVG(quantity * price) as avgTradeSize
         FROM orders 
         WHERE status = 'filled' AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting trading volume stats:', error);
      throw error;
    }
  }

  /**
   * Get top traders
   */
  async getTopTraders(limit = 10): Promise<any> {
    try {
      const result = await query(
        `SELECT 
          u.id,
          u.full_name,
          u.email,
          COUNT(o.id) as totalTrades,
          SUM(CASE WHEN o.status = 'filled' THEN 1 ELSE 0 END) as filledTrades,
          SUM(CASE WHEN o.status = 'filled' THEN o.quantity * o.price ELSE 0 END) as totalVolume
         FROM users u
         LEFT JOIN orders o ON u.id = o.user_id
         GROUP BY u.id, u.full_name, u.email
         ORDER BY totalVolume DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting top traders:', error);
      throw error;
    }
  }

  /**
   * Get AI bot statistics
   */
  async getAIBotStats(): Promise<any> {
    try {
      const totalBotsResult = await query('SELECT COUNT(*) as count FROM ai_trading_bots');
      const totalBots = parseInt(totalBotsResult.rows[0]?.count || '0');

      const activeBotsResult = await query(
        "SELECT COUNT(*) as count FROM ai_trading_bots WHERE status = 'active'"
      );
      const activeBots = parseInt(activeBotsResult.rows[0]?.count || '0');

      const performanceResult = await query(
        `SELECT 
          AVG(CAST(roi AS FLOAT)) as avgROI,
          AVG(CAST(win_rate AS FLOAT)) as avgWinRate
         FROM ai_trading_bots`
      );

      const avgROI = parseFloat(performanceResult.rows[0]?.avgroi || '0');
      const avgWinRate = parseFloat(performanceResult.rows[0]?.avgwinrate || '0');

      return {
        totalBots,
        activeBots,
        inactiveBots: totalBots - activeBots,
        averageROI: `${avgROI.toFixed(2)}%`,
        averageWinRate: `${avgWinRate.toFixed(2)}%`,
      };
    } catch (error) {
      console.error('Error getting AI bot stats:', error);
      throw error;
    }
  }

  /**
   * Suspend user account
   */
  async suspendUser(userId: string, adminId: string, reason: string): Promise<void> {
    try {
      await query(
        `UPDATE users SET account_status = 'suspended', updated_at = NOW() WHERE id = $1`,
        [userId]
      );

      // Log action
      await query(
        `INSERT INTO admin_actions (id, admin_id, action, reason, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [uuidv4(), adminId, 'suspend_user', reason]
      );
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  /**
   * Unsuspend user account
   */
  async unsuspendUser(userId: string, adminId: string): Promise<void> {
    try {
      await query(
        `UPDATE users SET account_status = 'active', updated_at = NOW() WHERE id = $1`,
        [userId]
      );

      // Log action
      await query(
        `INSERT INTO admin_actions (id, admin_id, action, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [uuidv4(), adminId, 'unsuspend_user']
      );
    } catch (error) {
      console.error('Error unsuspending user:', error);
      throw error;
    }
  }
}

export default new AdminService();
