import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * Um lançamento se vincula a um cliente OU a um fornecedor, nunca aos dois ao
 * mesmo tempo (FR-005) — os dois preenchidos deixariam ambíguo quem é a
 * contraparte na DRE e nos relatórios por cliente/fornecedor.
 */
export class FinancialEntryPartyConflictError extends DomainError {
  constructor() {
    super({
      internalMessage:
        'Financial entry cannot have both customerId and supplierId set',
      externalMessage:
        'Um lançamento não pode estar vinculado a um cliente e a um fornecedor ao mesmo tempo.',
      context: FinancialEntryPartyConflictError.name,
    });
  }
}
