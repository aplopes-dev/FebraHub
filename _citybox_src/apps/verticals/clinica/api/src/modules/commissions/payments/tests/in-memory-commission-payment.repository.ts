import { CommissionPayment } from '../domain/entities/commission-payment.entity';
import {
  CommissionPaymentRepository,
  type CommissionPaymentFilterCriteria,
  type CommissionPaymentLoaded,
  type DashboardCommissionPaymentBundle,
} from '../domain/repositories/commission-payment.repository.interface';
import type { CommissionAccrual } from '../../accruals/domain/entities/commission-accrual.entity';
import type { CommissionType } from '../../shared/domain/commission-enums';
import { toIsoDateOnly } from '../../shared/domain/commission-date.utils';

type StoredPayment = {
  payment: CommissionPayment;
  accrualIds: string[];
};

function matchesPeriod(
  date: Date,
  startDate?: string,
  endDate?: string,
): boolean {
  const iso = toIsoDateOnly(date);
  if (startDate && iso < startDate) return false;
  if (endDate && iso > endDate) return false;
  return true;
}

export class InMemoryCommissionPaymentRepository extends CommissionPaymentRepository {
  private payments: StoredPayment[] = [];
  private accrualLookup: () => CommissionAccrual[] = () => [];
  private commissionTypes: Record<string, CommissionType> = {};
  private markAccrualsPaid: (
    storeId: string,
    ids: string[],
  ) => Promise<void> = async () => undefined;

  /** Wire accrual repo methods for tests. */
  bindAccruals(deps: {
    getAll: () => CommissionAccrual[];
    markPaid: (storeId: string, ids: string[]) => Promise<void>;
  }): void {
    this.accrualLookup = deps.getAll;
    this.markAccrualsPaid = deps.markPaid;
  }

  /** Map accrualId → commissionType for dashboard tests. */
  bindCommissionTypes(types: Record<string, CommissionType>): void {
    this.commissionTypes = { ...types };
  }

  seed(payments: StoredPayment[]): void {
    this.payments = [...payments];
  }

  async saveWithItems(
    payment: CommissionPayment,
    accrualIds: string[],
  ): Promise<CommissionPayment> {
    this.payments = [...this.payments, { payment, accrualIds: [...accrualIds] }];
    await this.markAccrualsPaid(payment.storeId, accrualIds);
    return payment;
  }

  async findMany(
    storeId: string,
    criteria: CommissionPaymentFilterCriteria,
  ): Promise<CommissionPaymentLoaded[]> {
    const filtered = this.filter(storeId, criteria).sort(
      (a, b) => b.payment.paymentDate.getTime() - a.payment.paymentDate.getTime(),
    );
    return filtered
      .slice(criteria.skip, criteria.skip + criteria.take)
      .map((item) => this.toLoaded(item));
  }

  async count(
    storeId: string,
    criteria: Omit<CommissionPaymentFilterCriteria, 'skip' | 'take'>,
  ): Promise<number> {
    return this.filter(storeId, criteria).length;
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<CommissionPaymentLoaded | null> {
    const found = this.payments.find(
      (item) => item.payment.storeId === storeId && item.payment.id === id,
    );
    return found ? this.toLoaded(found) : null;
  }

  async listPaymentsForDashboardInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<DashboardCommissionPaymentBundle[]> {
    const startIso = toIsoDateOnly(range.startAt);
    const endIso = toIsoDateOnly(range.endAt);

    return this.payments
      .filter(({ payment }) => {
        if (payment.storeId !== storeId) return false;
        return matchesPeriod(payment.paymentDate, startIso, endIso);
      })
      .sort(
        (a, b) =>
          a.payment.paymentDate.getTime() - b.payment.paymentDate.getTime(),
      )
      .map((item) => this.toDashboardBundle(item));
  }

  async listCommissionPaymentYears(storeId: string): Promise<number[]> {
    const years = new Set<number>();
    for (const { payment } of this.payments) {
      if (payment.storeId !== storeId) continue;
      years.add(Number(toIsoDateOnly(payment.paymentDate).slice(0, 4)));
    }
    return [...years].filter(Number.isFinite).sort((a, b) => b - a);
  }

  private filter(
    storeId: string,
    criteria: Omit<CommissionPaymentFilterCriteria, 'skip' | 'take'>,
  ): StoredPayment[] {
    const search = criteria.search?.trim().toLowerCase();
    return this.payments.filter(({ payment }) => {
      if (payment.storeId !== storeId) return false;
      if (criteria.memberId && payment.memberId !== criteria.memberId) {
        return false;
      }
      if (
        !matchesPeriod(
          payment.paymentDate,
          criteria.startDate,
          criteria.endDate,
        )
      ) {
        return false;
      }
      if (search && !payment.memberName.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    });
  }

  private toDashboardBundle(
    item: StoredPayment,
  ): DashboardCommissionPaymentBundle {
    const idSet = new Set(item.accrualIds);
    const accruals = this.accrualLookup().filter((accrual) =>
      idSet.has(accrual.id),
    );

    return {
      paymentId: item.payment.id,
      memberId: item.payment.memberId,
      memberName: item.payment.memberName,
      paymentDate: item.payment.paymentDate,
      discountCents: item.payment.discountCents,
      items: accruals.map((accrual) => ({
        accrualId: accrual.id,
        paymentTrigger: accrual.paymentTrigger,
        commissionType: this.commissionTypes[accrual.id] ?? 'percentage',
        planName: accrual.planName,
        specialtyName: accrual.specialtyName,
        treatmentName: accrual.treatmentName,
        patientName: accrual.patientName,
        paidValueCents: accrual.paidValueCents,
        treatmentCostCents: accrual.treatmentCostCents,
        installment: accrual.installment,
        commissionCents: accrual.commissionCents,
      })),
    };
  }

  private toLoaded(item: StoredPayment): CommissionPaymentLoaded {
    const idSet = new Set(item.accrualIds);
    const accruals = this.accrualLookup().filter((accrual) =>
      idSet.has(accrual.id),
    );
    return {
      payment: CommissionPayment.with(
        {
          storeId: item.payment.storeId,
          memberId: item.payment.memberId,
          memberName: item.payment.memberName,
          description: item.payment.description,
          paymentDate: item.payment.paymentDate,
          accountId: item.payment.accountId,
          paymentMethod: item.payment.paymentMethod,
          grossCents: item.payment.grossCents,
          discountCents: item.payment.discountCents,
          netCents: item.payment.netCents,
          observation: item.payment.observation,
          expenseEntryId: item.payment.expenseEntryId,
          accrualIds: item.accrualIds,
          createdAt: item.payment.createdAt,
          updatedAt: item.payment.updatedAt,
        },
        item.payment.id,
      ),
      accruals,
    };
  }
}
