import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** 409 — só é permitida uma regra `budget_approved` por profissional. */
export class CommissionBudgetApprovedDuplicateError extends DomainError {
  constructor(context: string, memberId: string) {
    super({
      internalMessage: `Member ${memberId} already has a budget_approved commission rule`,
      externalMessage:
        'Só é permitida uma regra de comissão por aprovação de orçamento por profissional',
      context,
    });
    this.name = 'CommissionBudgetApprovedDuplicateError';
  }
}
