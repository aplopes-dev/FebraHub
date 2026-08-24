import type { CommissionAccrual } from '../domain/entities/commission-accrual.entity';

/** Stub para testes — não consulta orçamento. */
export class PassthroughEnrichCommissionTreatmentNamesService {
  async execute(
    _storeId: string,
    accruals: CommissionAccrual[],
  ): Promise<CommissionAccrual[]> {
    return accruals;
  }
}
