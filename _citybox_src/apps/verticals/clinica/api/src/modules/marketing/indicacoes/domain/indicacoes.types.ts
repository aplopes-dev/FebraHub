export const INDICACOES_REFERRED_ORIGIN_SYSTEM_KEYS = [
  'indicacao',
  'indicacao_profissional',
  'indicacao_profissional_externo',
] as const;

export const INDICACOES_REFERRED_BY_UNINFORMED = 'Não informado';

export type IndicacoesPeriodMode = 'annual' | 'monthly';

export type IndicacoesFirstAppointmentStatus =
  | 'agendada'
  | 'nao_realizada'
  | 'realizada';

export type IndicacoesReferrerKind = 'patient' | 'team' | 'external';

export type IndicacoesReferredPatientRow = {
  id: string;
  name: string;
  phone: string;
  referredBy: string;
  referralDate: string;
  firstAppointmentDate: string | null;
  firstAppointmentStatus: IndicacoesFirstAppointmentStatus;
  approvedBudgetsCount: number;
};

export type IndicacoesReferrerRow = {
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

export type IndicacoesPeriodCriteria = {
  startDate: string;
  endDate: string;
};

export type ListIndicacoesReferredPatientsCriteria = IndicacoesPeriodCriteria & {
  skip: number;
  take: number;
  sortOrder: 'asc' | 'desc';
  referrerKind?: IndicacoesReferrerKind;
  referrerId?: string;
};

export type ListIndicacoesReferrersCriteria = IndicacoesPeriodCriteria & {
  skip: number;
  take: number;
  sortBy: 'totalReferrals' | 'approvedBudgetsCount';
  sortOrder: 'asc' | 'desc';
};

export type PaginatedIndicacoesResult<T> = {
  items: T[];
  total: number;
};
