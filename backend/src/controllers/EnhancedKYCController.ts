import { Request, Response } from 'express';
import GeminiKYCService from '../services/GeminiKYCService';
import KYCService from '../services/KYCService';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export class EnhancedKYCController {
  /**
   * Submit KYC with automatic Gemini AI verification
   */
  async submitKYCWithAutoVerification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { fullName, dateOfBirth, address, country, phoneNumber, documentType } = req.body;
      const files = (req as any).files;

      // Validate inputs
      if (!fullName || !dateOfBirth || !address || !country || !documentType) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      // Check if files uploaded
      if (!files || !files.document || !files.selfie) {
        res.status(400).json({
          success: false,
          error: 'Document and selfie photos are required',
        });
        return;
      }

      // Perform automated KYC verification with Gemini
      const verification = await GeminiKYCService.performFullKYCVerification(
        files.document[0].path,
        files.selfie[0].path,
        documentType,
        fullName,
        dateOfBirth,
        address,
        country
      );

      // Save KYC submission to database
      const kycId = uuidv4();
      const kycStatus =
        verification.overallStatus === 'approved' ? 'approved' : verification.overallStatus === 'rejected' ? 'rejected' : 'manual-review';

      await query(
        `INSERT INTO kyc_verifications 
         (id, user_id, document_type, status, analysis_result, document_url, selfie_url, 
          full_name, date_of_birth, address, phone_number, country, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          kycId,
          userId,
          documentType,
          kycStatus,
          JSON.stringify(verification),
          files.document[0].path,
          files.selfie[0].path,
          fullName,
          dateOfBirth,
          address,
          phoneNumber,
          country,
        ]
      );

      // If approved, update user status
      if (verification.overallStatus === 'approved') {
        await query(
          `UPDATE users SET kyc_status = 'verified', kyc_verified_at = NOW() WHERE id = $1`,
          [userId]
        );
      } else if (verification.overallStatus === 'rejected') {
        await query(
          `UPDATE users SET kyc_status = 'rejected', updated_at = NOW() WHERE id = $1`,
          [userId]
        );
      } else {
        // Set to manual review
        await query(
          `UPDATE users SET kyc_status = 'pending_review', updated_at = NOW() WHERE id = $1`,
          [userId]
        );
      }

      res.json({
        success: true,
        data: {
          kycId,
          status: kycStatus,
          analysis: verification,
          message: verification.finalRecommendation,
        },
      });
    } catch (error) {
      console.error('Error submitting KYC with auto verification:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit KYC',
      });
    }
  }

  /**
   * Get KYC status for user
   */
  async getKYCStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      const result = await query(
        `SELECT id, user_id, document_type, status, created_at, updated_at, 
                analysis_result, full_name, address, country
         FROM kyc_verifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        res.json({
          success: true,
          data: null,
          message: 'No KYC submission found',
        });
        return;
      }

      const kycRecord = result.rows[0];
      const analysisResult = typeof kycRecord.analysis_result === 'string' ? JSON.parse(kycRecord.analysis_result) : kycRecord.analysis_result;

      res.json({
        success: true,
        data: {
          id: kycRecord.id,
          status: kycRecord.status,
          documentType: kycRecord.document_type,
          submittedAt: kycRecord.created_at,
          updatedAt: kycRecord.updated_at,
          analysis: analysisResult,
          userInfo: {
            fullName: kycRecord.full_name,
            address: kycRecord.address,
            country: kycRecord.country,
          },
        },
      });
    } catch (error) {
      console.error('Error getting KYC status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get KYC status',
      });
    }
  }

  /**
   * Re-submit KYC after rejection
   */
  async resubmitKYC(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const { fullName, dateOfBirth, address, country, phoneNumber, documentType } = req.body;
      const files = (req as any).files;

      if (!files || !files.document || !files.selfie) {
        res.status(400).json({
          success: false,
          error: 'Document and selfie photos are required',
        });
        return;
      }

      // Check if user has a previous rejected KYC
      const previousKYC = await query(
        `SELECT status FROM kyc_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      if (previousKYC.rows.length === 0 || previousKYC.rows[0].status !== 'rejected') {
        res.status(400).json({
          success: false,
          error: 'User has no rejected KYC to resubmit',
        });
        return;
      }

      // Perform re-verification
      const verification = await GeminiKYCService.performFullKYCVerification(
        files.document[0].path,
        files.selfie[0].path,
        documentType,
        fullName,
        dateOfBirth,
        address,
        country
      );

      // Save new KYC submission
      const kycId = uuidv4();
      const kycStatus = verification.overallStatus === 'approved' ? 'approved' : 'manual-review';

      await query(
        `INSERT INTO kyc_verifications 
         (id, user_id, document_type, status, analysis_result, document_url, selfie_url, 
          full_name, date_of_birth, address, phone_number, country, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          kycId,
          userId,
          documentType,
          kycStatus,
          JSON.stringify(verification),
          files.document[0].path,
          files.selfie[0].path,
          fullName,
          dateOfBirth,
          address,
          phoneNumber,
          country,
        ]
      );

      // Update user status
      if (verification.overallStatus === 'approved') {
        await query(
          `UPDATE users SET kyc_status = 'verified', kyc_verified_at = NOW() WHERE id = $1`,
          [userId]
        );
      } else {
        await query(
          `UPDATE users SET kyc_status = 'pending_review', updated_at = NOW() WHERE id = $1`,
          [userId]
        );
      }

      res.json({
        success: true,
        data: {
          kycId,
          status: kycStatus,
          analysis: verification,
          message: verification.finalRecommendation,
        },
      });
    } catch (error) {
      console.error('Error resubmitting KYC:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resubmit KYC',
      });
    }
  }

  /**
   * Get KYC analysis details (for admin)
   */
  async getKYCAnalysisDetails(req: Request, res: Response): Promise<void> {
    try {
      const { kycId } = req.params;

      const result = await query(
        `SELECT id, user_id, document_type, status, analysis_result, created_at
         FROM kyc_verifications
         WHERE id = $1`,
        [kycId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'KYC record not found',
        });
        return;
      }

      const kycRecord = result.rows[0];
      const analysisResult = typeof kycRecord.analysis_result === 'string' ? JSON.parse(kycRecord.analysis_result) : kycRecord.analysis_result;

      res.json({
        success: true,
        data: {
          id: kycRecord.id,
          userId: kycRecord.user_id,
          documentType: kycRecord.document_type,
          status: kycRecord.status,
          analysis: analysisResult,
          submittedAt: kycRecord.created_at,
        },
      });
    } catch (error) {
      console.error('Error getting KYC analysis details:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get KYC details',
      });
    }
  }

  /**
   * Get document for verification (Gemini re-analysis)
   */
  async analyzeDocumentWithGemini(req: Request, res: Response): Promise<void> {
    try {
      const { filePath, documentType } = req.body;

      if (!filePath || !documentType) {
        res.status(400).json({
          success: false,
          error: 'File path and document type are required',
        });
        return;
      }

      const analysis = await GeminiKYCService.analyzeDocument(filePath, documentType);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error('Error analyzing document:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze document',
      });
    }
  }

  /**
   * Analyze selfie/facial recognition (Gemini)
   */
  async analyzeSelfieWithGemini(req: Request, res: Response): Promise<void> {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        res.status(400).json({
          success: false,
          error: 'File path is required',
        });
        return;
      }

      const analysis = await GeminiKYCService.analyzeFacialRecognition(filePath);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error('Error analyzing selfie:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze selfie',
      });
    }
  }
}

export default new EnhancedKYCController();
