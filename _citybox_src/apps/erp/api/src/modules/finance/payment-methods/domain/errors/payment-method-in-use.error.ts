import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** FR-021: forma de pagamento própria referenciada por algum pagamento existente. */
export class PaymentMethodInUseError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `PaymentMethod ${id} is referenced by existing FinancialEntryPayment rows`,
      externalMessage:
        'Esta forma de pagamento está em uso em lançamentos existentes e não pode ser excluída.',
      context: PaymentMethodInUseError.name,
    });
  }
}
