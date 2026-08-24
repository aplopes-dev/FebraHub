import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** 409 — já existe contrato emitido para este orçamento. */
export class PatientContractEmissionBudgetDuplicateError extends DomainError {
  constructor(context: string, budgetId: string) {
    super({
      internalMessage: `Contract emission already exists for budget: ${budgetId}`,
      externalMessage: 'Já existe um contrato emitido para este orçamento',
      context,
    });
    this.name = 'PatientContractEmissionBudgetDuplicateError';
  }
}
