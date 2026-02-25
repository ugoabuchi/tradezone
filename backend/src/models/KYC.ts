import { query } from '../config/database';
import { KYCVerification } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const submitKYC = async (
  userId: string,
  data: {
    fullName: string;
    dateOfBirth: string;
    country: string;
    idType: string;
    idNumber: string;
    address: string;
    phoneNumber: string;
    documentUrl?: string;
  }
): Promise<KYCVerification> => {
  const result = await query(
    `INSERT INTO kyc_verifications 
    (id, user_id, full_name, date_of_birth, country, id_type, id_number, address, phone_number, document_url, status) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending') 
    RETURNING *`,
    [
      uuidv4(),
      userId,
      data.fullName,
      data.dateOfBirth,
      data.country,
      data.idType,
      data.idNumber,
      data.address,
      data.phoneNumber,
      data.documentUrl || null,
    ]
  );
  return result.rows[0];
};

export const getKYCByUserId = async (userId: string): Promise<KYCVerification | null> => {
  const result = await query('SELECT * FROM kyc_verifications WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
};

export const updateKYCStatus = async (
  kycId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<KYCVerification> => {
  const result = await query(
    `UPDATE kyc_verifications 
    SET status = $1, rejection_reason = $2, verified_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE verified_at END
    WHERE id = $3 
    RETURNING *`,
    [status, rejectionReason || null, kycId]
  );
  return result.rows[0];
};

export const getAllPendingKYC = async (limit: number = 50): Promise<KYCVerification[]> => {
  const result = await query(
    'SELECT * FROM kyc_verifications WHERE status = $1 ORDER BY submitted_at ASC LIMIT $2',
    ['pending', limit]
  );
  return result.rows;
};
