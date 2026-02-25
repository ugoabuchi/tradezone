import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

interface KYCDocumentAnalysis {
  documentType: string;
  isValid: boolean;
  confidence: number; // 0-100
  extractedData: {
    name?: string;
    dateOfBirth?: string;
    documentNumber?: string;
    expiryDate?: string;
    issuingCountry?: string;
    documentStatus?: string;
  };
  flaggedIssues: string[];
  recommendations: string;
}

interface FacialRecognitionResult {
  isFace: boolean;
  quality: number; // 0-100
  livenessScore: number; // 0-100 (how likely the image is a live person)
  confidence: number; // 0-100
  recommendations: string[];
}

interface AddressVerificationResult {
  isValidAddress: boolean;
  confidence: number; // 0-100
  addressDetails: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  issues: string[];
}

interface ComplianceCheckResult {
  isPEP: boolean; // Politically Exposed Person
  isSanctioned: boolean;
  riskScore: number; // 0-100
  recommendations: string[];
  requiresManualReview: boolean;
}

interface KYCVerificationResult {
  overallStatus: 'approved' | 'rejected' | 'manual-review';
  overallConfidence: number; // 0-100
  documentAnalysis: KYCDocumentAnalysis;
  facialRecognition: FacialRecognitionResult;
  addressVerification: AddressVerificationResult;
  complianceCheck: ComplianceCheckResult;
  finalRecommendation: string;
  requiredManualReviewReason?: string;
}

export class GeminiKYCService {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro-vision' });
  }

  /**
   * Convert image file to base64
   */
  private async imageToBase64(filePath: string): Promise<string> {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString('base64');
  }

  /**
   * Analyze KYC document (ID, Passport, Driving License)
   */
  async analyzeDocument(filePath: string, documentType: string): Promise<KYCDocumentAnalysis> {
    try {
      const base64Image = await this.imageToBase64(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeType(ext);

      const prompt = `You are a KYC (Know Your Customer) document verification expert. Analyze this ${documentType} image and provide detailed information about the document.

Please provide your analysis in the following JSON format:
{
  "documentType": "type of document",
  "isValid": true/false,
  "confidence": 0-100 (confidence level in percentage),
  "extractedData": {
    "name": "full name if visible",
    "dateOfBirth": "DOB in YYYY-MM-DD format if visible",
    "documentNumber": "ID/Passport number",
    "expiryDate": "expiry date in YYYY-MM-DD format",
    "issuingCountry": "country code",
    "documentStatus": "active/expired/revoked"
  },
  "flaggedIssues": ["list of any issues detected", "forgery indicators", "quality issues"],
  "recommendations": "brief recommendation for approval/rejection"
}

Look for:
1. Document authenticity markers
2. Clear and legible information
3. Security features (holograms, watermarks)
4. Document expiry status
5. Any signs of tampering or forgery
6. Image quality and clarity`;

      const response = await this.model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ]);

      const analysisText = response.response.text();
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return this.getDefaultDocumentAnalysis(documentType, false, 'Failed to extract analysis');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error) {
      console.error('Error analyzing document:', error);
      return this.getDefaultDocumentAnalysis(documentType, false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Analyze facial recognition from selfie/photo
   */
  async analyzeFacialRecognition(filePath: string): Promise<FacialRecognitionResult> {
    try {
      const base64Image = await this.imageToBase64(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeType(ext);

      const prompt = `You are a facial recognition and liveness detection expert. Analyze this image and provide a detailed face analysis.

Please provide your analysis in the following JSON format:
{
  "isFace": true/false (is this actually a face),
  "quality": 0-100 (image quality score),
  "livenessScore": 0-100 (likelihood this is a living person, not a photo/mask),
  "confidence": 0-100 (overall confidence in the analysis),
  "recommendations": ["list of recommendations or concerns"]
}

Check for:
1. Is there a clear face in the image?
2. Face quality and clarity
3. Liveness indicators (natural lighting, eye movement, texture)
4. Spoofing risks (printed photo, mask, or deep fake indicators)
5. Multiple faces (flag if detected)
6. Eyes open and looking at camera
7. Natural skin texture and pores`;

      const response = await this.model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ]);

      const analysisText = response.response.text();
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          isFace: false,
          quality: 0,
          livenessScore: 0,
          confidence: 0,
          recommendations: ['Failed to analyze image'],
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing facial recognition:', error);
      return {
        isFace: false,
        quality: 0,
        livenessScore: 0,
        confidence: 0,
        recommendations: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Verify address from document
   */
  async verifyAddress(addressText: string, country: string): Promise<AddressVerificationResult> {
    try {
      const prompt = `You are an address verification expert. Verify the following address and check if it's valid and legitimate.

Address: ${addressText}
Country: ${country}

Please provide your analysis in the following JSON format:
{
  "isValidAddress": true/false,
  "confidence": 0-100,
  "addressDetails": {
    "street": "street address",
    "city": "city",
    "state": "state/province",
    "postalCode": "postal code",
    "country": "country"
  },
  "issues": ["list of any issues with the address"]
}

Check for:
1. Valid format for the country
2. Real postal code format
3. City/state combinations validity
4. Known address patterns for the region
5. No obvious placeholder addresses`;

      const response = await this.model.generateContent(prompt);
      const analysisText = response.response.text();
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          isValidAddress: false,
          confidence: 0,
          addressDetails: {},
          issues: ['Failed to parse address'],
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error verifying address:', error);
      return {
        isValidAddress: false,
        confidence: 0,
        addressDetails: {},
        issues: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Perform compliance checks (PEP, Sanctions, Risk Assessment)
   */
  async performComplianceCheck(
    fullName: string,
    dateOfBirth: string,
    country: string
  ): Promise<ComplianceCheckResult> {
    try {
      const prompt = `You are a compliance and AML (Anti-Money Laundering) expert. Perform compliance checks on the following person.

Name: ${fullName}
Date of Birth: ${dateOfBirth}
Country: ${country}

Based on common knowledge, please provide your analysis in the following JSON format:
{
  "isPEP": false (is this person a Politically Exposed Person),
  "isSanctioned": false (is this person on any sanctions list),
  "riskScore": 0-100 (overall risk assessment),
  "recommendations": ["list of recommendations"],
  "requiresManualReview": true/false
}

Consider:
1. Common PEP indicators in the name
2. High-risk countries or regions
3. Common risk patterns in similar profiles
4. Age verification possibilities
5. Name variations or aliases

Note: This is a basic check. High scores or risk indicators should trigger manual review.`;

      const response = await this.model.generateContent(prompt);
      const analysisText = response.response.text();
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          isPEP: false,
          isSanctioned: false,
          riskScore: 50, // Default to medium risk if uncertain
          recommendations: ['Manual review recommended'],
          requiresManualReview: true,
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error performing compliance check:', error);
      return {
        isPEP: false,
        isSanctioned: false,
        riskScore: 75, // Higher default risk on error
        recommendations: ['Manual review required due to analysis error'],
        requiresManualReview: true,
      };
    }
  }

  /**
   * Complete KYC verification process
   */
  async performFullKYCVerification(
    documentPath: string,
    selfiePhotoPath: string,
    documentType: string,
    fullName: string,
    dateOfBirth: string,
    address: string,
    country: string
  ): Promise<KYCVerificationResult> {
    // Analyze document
    const documentAnalysis = await this.analyzeDocument(documentPath, documentType);

    // Analyze facial recognition
    const facialRecognition = await this.analyzeFacialRecognition(selfiePhotoPath);

    // Verify address
    const addressVerification = await this.verifyAddress(address, country);

    // Perform compliance check
    const complianceCheck = await this.performComplianceCheck(fullName, dateOfBirth, country);

    // Calculate overall confidence and status
    const confidence = (documentAnalysis.confidence + facialRecognition.confidence + addressVerification.confidence) / 3;

    // Determine overall status
    let overallStatus: 'approved' | 'rejected' | 'manual-review' = 'approved';
    let requiredManualReviewReason: string | undefined;

    // Rejection criteria
    if (!documentAnalysis.isValid || documentAnalysis.confidence < 50) {
      overallStatus = 'rejected';
    } else if (!facialRecognition.isFace || facialRecognition.livenessScore < 40) {
      overallStatus = 'rejected';
    } else if (!addressVerification.isValidAddress) {
      overallStatus = 'rejected';
    } else if (complianceCheck.isSanctioned || complianceCheck.isPEP) {
      overallStatus = 'rejected';
    }

    // Manual review criteria
    if (overallStatus === 'approved') {
      if (
        documentAnalysis.confidence < 75 ||
        facialRecognition.livenessScore < 60 ||
        complianceCheck.riskScore > 60 ||
        documentAnalysis.flaggedIssues.length > 0 ||
        addressVerification.issues.length > 0 ||
        complianceCheck.requiresManualReview
      ) {
        overallStatus = 'manual-review';
        requiredManualReviewReason = 'One or more checks require manual verification';
      }
    }

    const finalRecommendation =
      overallStatus === 'approved'
        ? 'KYC verification passed. User account approved.'
        : overallStatus === 'rejected'
          ? 'KYC verification failed. User is not eligible.'
          : 'KYC verification requires manual review by administrator.';

    return {
      overallStatus,
      overallConfidence: confidence,
      documentAnalysis,
      facialRecognition,
      addressVerification,
      complianceCheck,
      finalRecommendation,
      requiredManualReviewReason,
    };
  }

  /**
   * Helper: Get MIME type from file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[extension] || 'image/jpeg';
  }

  /**
   * Default document analysis response
   */
  private getDefaultDocumentAnalysis(
    documentType: string,
    isValid: boolean,
    reason: string
  ): KYCDocumentAnalysis {
    return {
      documentType,
      isValid,
      confidence: 0,
      extractedData: {},
      flaggedIssues: [reason],
      recommendations: 'Manual review required',
    };
  }
}

export default new GeminiKYCService();
