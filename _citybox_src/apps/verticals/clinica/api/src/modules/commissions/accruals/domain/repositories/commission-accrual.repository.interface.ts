import type { CommissionAccrual } from '../entities/commission-accrual.entity';

export type CommissionAccrualFilterCriteria = {
  startDate?: string;
  endDate?: string;
  memberId?: string;
  search?: string;
};

export abstract class CommissionAccrualRepository {
  abstract save(accrual: CommissionAccrual): Promise<CommissionAccrual>;

  abstract findOpenByStore(
    storeId: string,
    criteria: CommissionAccrualFilterCriteria,
  ): Promise<CommissionAccrual[]>;

  abstract findOpenByMember(
    storeId: string,
    memberId: string,
    criteria?: CommissionAccrualFilterCriteria,
  ): Promise<CommissionAccrual[]>;

  abstract findManyByIds(
    storeId: string,
    memberId: string,
    ids: string[],
  ): Promise<CommissionAccrual[]>;

  /** Accruals já gerados a partir de um lançamento financeiro (idempotência). */
  abstract findBySourceFinancialEntryId(
    storeId: string,
    sourceFinancialEntryId: string,
  ): Promise<CommissionAccrual[]>;

  /** Accruals de aprovação de orçamento (idempotência). */
  abstract findBySourceBudgetId(
    storeId: string,
    sourceBudgetId: string,
  ): Promise<CommissionAccrual[]>;

  /** Accruals de tratamento finalizado (idempotência). */
  abstract findBySourcePatientTreatmentId(
    storeId: string,
    sourcePatientTreatmentId: string,
  ): Promise<CommissionAccrual[]>;

  abstract markPaid(storeId: string, ids: string[]): Promise<void>;
}
