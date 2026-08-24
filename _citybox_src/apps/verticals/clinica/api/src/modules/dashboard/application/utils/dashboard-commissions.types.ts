import type {
  CommissionPaymentTrigger,
  CommissionType,
} from '../../../commissions/shared/domain/commission-enums';
import type { DashboardCommissionPaymentBundle as RepoBundle } from '../../../commissions/payments/domain/repositories/commission-payment.repository.interface';

export type DashboardCommissionsPeriodMode = 'annual' | 'monthly';

export type DashboardCommissionTrigger = CommissionPaymentTrigger;
export type DashboardCommissionType = CommissionType;

export type DashboardCommissionPaymentBundle = RepoBundle;

/** Linha flat do card/dialog (1 accrual pago). */
export type DashboardCommissionPaidRow = {
  id: string;
  paidAt: string;
  professionalId: string;
  professionalName: string;
  trigger: DashboardCommissionTrigger;
  commissionType: DashboardCommissionType;
  grossCents: number;
  discountCents: number;
  netCents: number;
  patientName: string;
  planName: string;
  specialtyName: string;
  treatmentName: string;
  treatmentValueCents: number;
  treatmentCostCents: number;
  installment: string | null;
};

export type DashboardCommissionBreakdownItem = {
  key: string;
  label: string;
  grossCents: number;
  percent: number;
};

export type DashboardCommissionProfessionalRank = {
  professionalId: string;
  professionalName: string;
  netCents: number;
  count: number;
};

export type DashboardCommissionsSummary = {
  netTotalCents: number;
  byTrigger: DashboardCommissionBreakdownItem[];
  byType: DashboardCommissionBreakdownItem[];
  ranking: DashboardCommissionProfessionalRank[];
};
