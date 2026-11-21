export type DataMode = 'LIVE' | 'CACHED' | 'SIMULATION';
export type AdvisoryLevel = 'CAUTION' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DEMO';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export interface AdvisoryRecommendation {
  code: string;
  priority: string;
}

export interface HeatAssessment {
  advisoryLevel: AdvisoryLevel;
  engineVersion: string;
  factors: unknown[];
  recommendations: AdvisoryRecommendation[];
  medicalValidation: false;
  disclaimerCode: string;
}

export interface HeatAssessmentResponse {
  dataMode: DataMode;
  assessment: HeatAssessment;
}
