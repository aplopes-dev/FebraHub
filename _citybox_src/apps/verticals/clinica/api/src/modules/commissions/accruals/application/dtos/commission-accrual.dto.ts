import type { CommissionPaymentTrigger } from '../../../shared/domain/commission-enums';

export type CreateCommissionAccrualDto = {
  storeId: string;
  memberId: string;
  memberName: string;
  ruleId?: string | null;
  paymentTrigger: CommissionPaymentTrigger;
  planName?: string;
  specialtyName?: string;
  treatmentName: string;
  patientName: string;
  paidValueCents: number;
  treatmentCostCents: number;
  installment?: string | null;
  commissionCents: number;
  accruedAt: string;
  sourceFinancialEntryId?: string | null;
  sourceBudgetId?: string | null;
  sourcePatientTreatmentId?: string | null;
};

export type ListOpenCommissionsDto = {
  storeId: string;
  page?: number;
  perPage?: number;
  startDate?: string;
  endDate?: string;
  /** Alias aceito na query: professionalId ou memberId */
  memberId?: string;
  search?: string;
};

export type GetOpenCommissionDetailDto = {
  storeId: string;
  memberId: string;
  startDate?: string;
  endDate?: string;
};
