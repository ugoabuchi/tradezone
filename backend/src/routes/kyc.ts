import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import EnhancedKYCController from '../controllers/EnhancedKYCController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/kyc');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// All KYC routes require authentication
router.use(authenticateToken);

// Submit KYC with automatic Gemini verification
router.post(
  '/submit',
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  EnhancedKYCController.submitKYCWithAutoVerification
);

// Get KYC status for current user
router.get('/status', EnhancedKYCController.getKYCStatus);

// Resubmit KYC after rejection
router.post(
  '/resubmit',
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  EnhancedKYCController.resubmitKYC
);

// Get KYC analysis details (for admin)
router.get('/analysis/:kycId', EnhancedKYCController.getKYCAnalysisDetails);

// Document analysis with Gemini (manual)
router.post('/analyze/document', EnhancedKYCController.analyzeDocumentWithGemini);

// Selfie analysis with Gemini (manual)
router.post('/analyze/selfie', EnhancedKYCController.analyzeSelfieWithGemini);

export default router;
