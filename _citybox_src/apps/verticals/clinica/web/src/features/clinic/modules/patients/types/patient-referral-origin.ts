export type PatientReferralOriginSystemKey =
  | 'indicacao'
  | 'indicacao_profissional'
  | 'indicacao_profissional_externo'
  | 'google'
  | 'instagram'
  | 'facebook'
  | 'outro';

export type PatientReferralOrigin = {
  id: string;
  name: string;
  systemKey: PatientReferralOriginSystemKey | null;
  isSystem: boolean;
};

export type PatientReferralOriginInput = {
  name: string;
};
