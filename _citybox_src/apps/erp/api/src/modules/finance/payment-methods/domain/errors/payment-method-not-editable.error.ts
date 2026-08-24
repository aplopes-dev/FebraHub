import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * FR-019 (spec `007-financeiro-ajustes-ui`) bloqueia edição **e** exclusão de
 * formas de pagamento de sistema — diferente de `CostCenter`, que só bloqueia
 * exclusão. Espelha `FinancialGroupImmutableFieldError`, mas aqui o bloqueio é
 * do registro inteiro, não de um campo específico.
 */
export class PaymentMethodNotEditableError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `PaymentMethod ${id} is provisioned by the system and cannot be edited`,
      externalMessage: 'Formas de pagamento do sistema não podem ser editadas.',
      context: PaymentMethodNotEditableError.name,
    });
  }
}
