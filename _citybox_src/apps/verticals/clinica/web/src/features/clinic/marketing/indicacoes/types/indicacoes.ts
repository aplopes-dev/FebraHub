export type IndicacoesPeriodMode = 'annual' | 'monthly';

export type FirstAppointmentStatus =
  | 'agendada'
  | 'nao_realizada'
  | 'realizada';

export type IndicacoesReferredPatient = {
  id: string;
  name: string;
  phone: string;
  referredBy: string;
  referralDate: string;
  firstAppointmentDate: string | null;
  firstAppointmentStatus: FirstAppointmentStatus;
  approvedBudgetsCount: number;
};

export type IndicacoesReferrerKind = 'patient' | 'team' | 'external';

export type IndicacoesReferrer = {
  id: string;
  name: string;
  phone: string;
  kind: IndicacoesReferrerKind;
  totalReferrals: number;
  approvedBudgetsCount: number;
};

export type IndicacoesKpis = {
  totalReferrals: number;
  approvedBudgetsValueCents: number;
  withoutScheduledAppointment: number;
  years: number[];
};
