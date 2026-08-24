import type { CommissionPayment } from '../entities/commission-payment.entity';
import type { CommissionAccrual } from '../../../accruals/domain/entities/commission-accrual.entity';
import type {
  CommissionPaymentTrigger,
  CommissionType,
} from '../../../shared/domain/commission-enums';

export type CommissionPaymentFilterCriteria = {
  startDate?: string;
  endDate?: string;
  memberId?: string;
  search?: string;
  skip: number;
  take: number;
};

export type CommissionPaymentLoaded = {
  payment: CommissionPayment;
  accruals: CommissionAccrual[];
};

/** Bundle para dashboard: pagamento + accruals com tipo da regra. */
export type DashboardCommissionPaymentBundle = {
  paymentId: string;
  memberId: string;
  memberName: string;
  paymentDate: Date;
  discountCents: number;
  items: Array<{
    accrualId: string;
    paymentTrigger: CommissionPaymentTrigger;
    commissionType: CommissionType;
    planName: string;
    specialtyName: string;
    treatmentName: string;
    patientName: string;
    paidValueCents: number;
    treatmentCostCents: number;
    installment: string | null;
    commissionCents: number;
  }>;
};

export abstract class CommissionPaymentRepository {
  abstract saveWithItems(
    payment: CommissionPayment,
    accrualIds: string[],
  ): Promise<CommissionPayment>;

  abstract findMany(
    storeId: string,
    criteria: CommissionPaymentFilterCriteria,
  ): Promise<CommissionPaymentLoaded[]>;

  abstract count(
    storeId: string,
    criteria: Omit<CommissionPaymentFilterCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract findById(
    storeId: string,
    id: string,
  ): Promise<CommissionPaymentLoaded | null>;

  /** Pagamentos no range de paymentDate com accruals + commissionType da regra. */
  abstract listPaymentsForDashboardInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<DashboardCommissionPaymentBundle[]>;

  /** Anos distintos de paymentDate (desc). */
  abstract listCommissionPaymentYears(storeId: string): Promise<number[]>;
}
