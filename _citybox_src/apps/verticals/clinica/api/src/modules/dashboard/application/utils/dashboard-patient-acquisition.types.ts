export type DashboardAcquisitionPeriodMode = 'annual' | 'monthly';

export type DashboardReferralSourceKey =
  | 'indicacao'
  | 'indicacao_profissional'
  | 'indicacao_profissional_externo'
  | 'google'
  | 'instagram'
  | 'facebook'
  | 'outro'
  | 'nao_informado';

export type PatientAcquisitionRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string | null;
  createdAt: Date;
  referralOriginSystemKey: DashboardReferralSourceKey | null;
  referralOriginName: string | null;
};

export type DashboardAcquisitionAggregate = {
  source: DashboardReferralSourceKey;
  label: string;
  count: number;
  percent: number;
};

export type DashboardAcquisitionPatientItem = {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string | null;
  registeredAt: string;
  referralSource: DashboardReferralSourceKey;
};
