import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { fromSeed } from 'bip32';
import crypto from 'crypto';

// KYC Levels and their limits
export enum KYCLevel {
  UNVERIFIED = 'unverified', // No KYC - Limited access
  BASIC = 'basic', // Email verified - Basic limits
  INTERMEDIATE = 'intermediate', // Document verified - Higher limits
  ADVANCED = 'advanced', // Full KYC - Full access
}

export interface KYCLimits {
  level: KYCLevel;
  dailyWithdrawalLimit: number; // USD
  monthlyWithdrawalLimit: number; // USD
  dailyDepositLimit: number; // USD
  monthlyDepositLimit: number; // USD
  maxTransactionAmount: number; // USD
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
}

export const KYC_LIMITS: Record<KYCLevel, KYCLimits> = {
  [KYCLevel.UNVERIFIED]: {
    level: KYCLevel.UNVERIFIED,
    dailyWithdrawalLimit: 0, // No withdrawals
    monthlyWithdrawalLimit: 0,
    dailyDepositLimit: 100, // Limited deposits
    monthlyDepositLimit: 500,
    maxTransactionAmount: 100,
    canTrade: false,
    canWithdraw: false,
    canDeposit: true,
  },
  [KYCLevel.BASIC]: {
    level: KYCLevel.BASIC,
    dailyWithdrawalLimit: 1000,
    monthlyWithdrawalLimit: 5000,
    dailyDepositLimit: 2000,
    monthlyDepositLimit: 15000,
    maxTransactionAmount: 1000,
    canTrade: true,
    canWithdraw: true,
    canDeposit: true,
  },
  [KYCLevel.INTERMEDIATE]: {
    level: KYCLevel.INTERMEDIATE,
    dailyWithdrawalLimit: 10000,
    monthlyWithdrawalLimit: 50000,
    dailyDepositLimit: 10000,
    monthlyDepositLimit: 100000,
    maxTransactionAmount: 10000,
    canTrade: true,
    canWithdraw: true,
    canDeposit: true,
  },
  [KYCLevel.ADVANCED]: {
    level: KYCLevel.ADVANCED,
    dailyWithdrawalLimit: 500000,
    monthlyWithdrawalLimit: 2000000,
    dailyDepositLimit: 500000,
    monthlyDepositLimit: 2000000,
    maxTransactionAmount: 500000,
    canTrade: true,
    canWithdraw: true,
    canDeposit: true,
  },
};

export interface CryptoWallet {
  id: string;
  userId: string;
  walletAddress: string;
  publicKey: string;
  encryptedPrivateKey: string;
  blockchain: 'ethereum' | 'bitcoin' | 'polygon' | 'solana' | 'bsc';
  balance: number;
  tokenBalance?: Record<string, number>;
  isActive: boolean;
  isPrimary: boolean;
  walletName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  fromWalletId: string;
  toAddress: string;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'trade';
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  transactionHash: string;
  confirmation: number;
  requiredConfirmations: number;
  kycLevelRequired: KYCLevel;
  createdAt: Date;
  completedAt?: Date;
}

export interface WalletCreateRequest {
  walletName: string;
  blockchain: 'ethereum' | 'bitcoin' | 'polygon' | 'solana' | 'bsc';
  importExisting?: {
    privateKey?: string;
    seedPhrase?: string;
  };
}

export interface TransferRequest {
  fromWalletId: string;
  toAddress: string;
  amount: number;
  fee?: number;
  password: string;
}

/**
 * Generate a new crypto wallet for specified blockchain
 */
export function generateWallet(blockchain: string) {
  const mnemonic = generateMnemonic(256); // BIP39 12-word seed phrase
  const seed = mnemonicToSeedSync(mnemonic);

  let derivationPath: string;
  let addressFunction: (key: any) => string;

  switch (blockchain) {
    case 'ethereum':
    case 'polygon':
    case 'bsc':
      // EVM compatible - m/44'/60'/0'/0/0
      derivationPath = "m/44'/60'/0'/0/0";
      addressFunction = (key: any) =>
        '0x' +
        crypto
          .createHash('sha256')
          .update(key.publicKey)
          .digest()
          .slice(-20)
          .toString('hex');
      break;

    case 'bitcoin':
      // Bitcoin - m/44'/0'/0'/0/0
      derivationPath = "m/44'/0'/0'/0/0";
      addressFunction = (key: any) => key.publicKey.toString('hex');
      break;

    case 'solana':
      // Solana - m/44'/501'/0'/0'
      derivationPath = "m/44'/501'/0'/0'";
      addressFunction = (key: any) => key.publicKey.toString('hex').slice(0, 44);
      break;

    default:
      throw new Error(`Unsupported blockchain: ${blockchain}`);
  }

  const root = fromSeed(seed);
  const child = root.derivePath(derivationPath);
  const privateKey = child.privateKey!.toString('hex');
  const publicKey = child.publicKey.toString('hex');
  const address = addressFunction(child);

  return {
    mnemonic,
    privateKey,
    publicKey,
    address,
    derivationPath,
  };
}

/**
 * Encrypt private key with password
 */
export function encryptPrivateKey(privateKey: string, password: string): string {
  const algorithm = 'aes-256-cbc';
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Combine salt + iv + encrypted data
  return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt private key with password
 */
export function decryptPrivateKey(encryptedData: string, password: string): string {
  const algorithm = 'aes-256-cbc';
  const [saltHex, ivHex, encrypted] = encryptedData.split(':');

  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Validate wallet address format
 */
export function validateAddress(address: string, blockchain: string): boolean {
  switch (blockchain) {
    case 'ethereum':
    case 'polygon':
    case 'bsc':
      // EVM: 0x followed by 40 hex characters
      return /^0x[a-fA-F0-9]{40}$/.test(address);

    case 'bitcoin':
      // Bitcoin: Starts with 1, 3, or bc1
      return /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/.test(address);

    case 'solana':
      // Solana: Base58 encoded, 44 characters
      return /^[1-9A-HJ-NP-Za-km-z]{44}$/.test(address);

    default:
      return false;
  }
}

/**
 * Get gas/network fees
 */
export function getNetworkFees(blockchain: string, amount: number): number {
  const fees: Record<string, number> = {
    ethereum: 0.01 + amount * 0.0001, // Base + percentage
    polygon: 0.001 + amount * 0.00001,
    bsc: 0.002 + amount * 0.00005,
    bitcoin: 0.0005 + amount * 0.0001,
    solana: 0.00025,
  };

  return fees[blockchain] || 0.001;
}

/**
 * Calculate transaction limit remaining for user
 */
export function calculateRemainingLimit(
  kycLevel: KYCLevel,
  limitType: 'daily' | 'monthly',
  limitDirection: 'withdrawal' | 'deposit'
): number {
  const limits = KYC_LIMITS[kycLevel];

  if (limitDirection === 'withdrawal') {
    return limitType === 'daily' ? limits.dailyWithdrawalLimit : limits.monthlyWithdrawalLimit;
  } else {
    return limitType === 'daily' ? limits.dailyDepositLimit : limits.monthlyDepositLimit;
  }
}

export default {
  generateWallet,
  encryptPrivateKey,
  decryptPrivateKey,
  validateAddress,
  getNetworkFees,
  calculateRemainingLimit,
  KYC_LIMITS,
  KYCLevel,
};
