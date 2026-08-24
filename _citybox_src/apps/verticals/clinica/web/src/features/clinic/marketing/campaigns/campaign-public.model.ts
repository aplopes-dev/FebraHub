/**
 * Modelos de dados para Campanha Pública
 */

export interface CampaignQuestionOption {
  id: string;
  label: string;
  tag?: string;
}

export interface CampaignQuestion {
  id: string;
  type: 'text' | 'phone' | 'email' | 'radio' | 'checkbox' | 'textarea';
  label: string;
  required: boolean;
  helpText?: string;
  options?: CampaignQuestionOption[];
}

export interface LgpdConsent {
  text: string;
  privacyPolicyUrl?: string;
}

export interface PublicCampaignData {
  campaignId: string;
  campaignName: string;
  clinicName: string;
  status: string;
  formDescription?: string;
  introText?: string;
  questions: CampaignQuestion[];
  lgpdConsent: LgpdConsent;
  primaryColor?: string;
  logoUrl?: string;
  successAction: 'message' | 'redirect';
  successMessage?: string;
  redirectUrl?: string;
}

export interface CampaignFormData {
  [key: string]: string | string[] | boolean;
  lgpdConsent: boolean;
}
