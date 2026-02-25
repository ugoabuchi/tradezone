import * as KYCModel from '../models/KYC';
import { query } from '../config/database';
import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';
const RECAPTCHA_API = 'https://www.google.com/recaptcha/api/siteverify';

export const verifyRecaptcha = async (token: string): Promise<boolean> => {
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn('reCAPTCHA secret key not configured');
    return true; // Allow if not configured in dev
  }

  try {
    const response = await axios.post(RECAPTCHA_API, null, {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      },
    });

    return response.data.success && response.data.score > 0.5; // Score above 0.5 is acceptable
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
};

export const submitKYC = async (userId: string, kycData: any, recaptchaToken: string) => {
  // Verify reCAPTCHA first
  const recaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaValid) {
    throw new Error('reCAPTCHA verification failed');
  }

  // Submit KYC data
  const kyc = await KYCModel.submitKYC(userId, {
    fullName: kycData.fullName,
    dateOfBirth: kycData.dateOfBirth,
    country: kycData.country,
    idType: kycData.idType,
    idNumber: kycData.idNumber,
    address: kycData.address,
    phoneNumber: kycData.phoneNumber,
    documentUrl: kycData.documentUrl,
  });

  // Update user status
  await query('UPDATE users SET kyc_status = $1 WHERE id = $2', ['pending', userId]);

  return kyc;
};

export const getKYCStatus = async (userId: string) => {
  const kyc = await KYCModel.getKYCByUserId(userId);
  const userResult = await query('SELECT kyc_status FROM users WHERE id = $1', [userId]);

  return {
    kycData: kyc,
    status: userResult.rows[0]?.kyc_status || 'not_started',
  };
};

export const approveKYC = async (kycId: string) => {
  const kyc = await KYCModel.updateKYCStatus(kycId, 'approved');

  // Update user status
  await query('UPDATE users SET kyc_status = $1 WHERE id = $2', ['approved', kyc.user_id]);

  return kyc;
};

export const rejectKYC = async (kycId: string, reason: string) => {
  const kyc = await KYCModel.updateKYCStatus(kycId, 'rejected', reason);

  // Update user status
  await query('UPDATE users SET kyc_status = $1 WHERE id = $2', ['rejected', kyc.user_id]);

  return kyc;
};

export const getPendingKYCVerifications = async () => {
  return KYCModel.getAllPendingKYC();
};
