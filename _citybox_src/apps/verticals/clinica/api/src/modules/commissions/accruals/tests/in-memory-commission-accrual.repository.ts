import { CommissionAccrual } from '../domain/entities/commission-accrual.entity';
import {
  CommissionAccrualRepository,
  type CommissionAccrualFilterCriteria,
} from '../domain/repositories/commission-accrual.repository.interface';
import { toIsoDateOnly } from '../../shared/domain/commission-date.utils';

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

export class InMemoryCommissionAccrualRepository extends CommissionAccrualRepository {
  private accruals: CommissionAccrual[] = [];

  seed(accruals: CommissionAccrual[]): void {
    this.accruals = [...accruals];
  }

  getAll(): CommissionAccrual[] {
    return this.accruals;
  }

  async save(accrual: CommissionAccrual): Promise<CommissionAccrual> {
    const idx = this.accruals.findIndex((item) => item.id === accrual.id);
    if (idx >= 0) {
      this.accruals = [
        ...this.accruals.slice(0, idx),
        accrual,
        ...this.accruals.slice(idx + 1),
      ];
    } else {
      this.accruals = [...this.accruals, accrual];
    }
    return accrual;
  }

  async findOpenByStore(
    storeId: string,
    criteria: CommissionAccrualFilterCriteria,
  ): Promise<CommissionAccrual[]> {
    return this.accruals.filter(
      (accrual) =>
        accrual.storeId === storeId &&
        accrual.status === 'open' &&
        this.matchesCriteria(accrual, criteria),
    );
  }

  async findOpenByMember(
    storeId: string,
    memberId: string,
    criteria?: CommissionAccrualFilterCriteria,
  ): Promise<CommissionAccrual[]> {
    return this.accruals.filter(
      (accrual) =>
        accrual.storeId === storeId &&
        accrual.memberId === memberId &&
        accrual.status === 'open' &&
        this.matchesCriteria(accrual, criteria ?? {}),
    );
  }

  async findManyByIds(
    storeId: string,
    memberId: string,
    ids: string[],
  ): Promise<CommissionAccrual[]> {
    const idSet = new Set(ids);
    return this.accruals.filter(
      (accrual) =>
        accrual.storeId === storeId &&
        accrual.memberId === memberId &&
        idSet.has(accrual.id),
    );
  }

  async findBySourceFinancialEntryId(
    storeId: string,
    sourceFinancialEntryId: string,
  ): Promise<CommissionAccrual[]> {
    return this.accruals.filter(
      (accrual) =>
        accrual.storeId === storeId &&
        accrual.sourceFinancialEntryId === sourceFinancialEntryId,
    );
  }

  async findBySourceBudgetId(
    storeId: string,
    sourceBudgetId: string,
  ): Promise<CommissionAccrual[]> {
    return this.accruals.filter(
      (accrual) =>
        accrual.storeId === storeId &&
        accrual.sourceBudgetId === sourceBudgetId,
    );
  }

  async findBySourcePatientTreatmentId(
    storeId: string,
    sourcePatientTreatmentId: string,
  ): Promise<CommissionAccrual[]> {
    return this.accruals.filter(
      (accrual) =>
        accrual.storeId === storeId &&
        accrual.sourcePatientTreatmentId === sourcePatientTreatmentId,
    );
  }

  async markPaid(storeId: string, ids: string[]): Promise<void> {
    const idSet = new Set(ids);
    this.accruals = this.accruals.map((accrual) => {
      if (accrual.storeId === storeId && idSet.has(accrual.id)) {
        return accrual.withPaid();
      }
      return accrual;
    });
  }

  private matchesCriteria(
    accrual: CommissionAccrual,
    criteria: CommissionAccrualFilterCriteria,
  ): boolean {
    if (criteria.memberId && accrual.memberId !== criteria.memberId) {
      return false;
    }
    if (
      !matchesPeriod(accrual.accruedAt, criteria.startDate, criteria.endDate)
    ) {
      return false;
    }
    const search = criteria.search?.trim().toLowerCase();
    if (search && !accrual.memberName.toLowerCase().includes(search)) {
      return false;
    }
    return true;
  }
}
