import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosSalePaymentsInsufficientError extends DomainError {
  constructor() {
    super({
      internalMessage: 'POS sale payments do not cover the order total',
      externalMessage:
        'A soma dos pagamentos deve ser maior ou igual ao total da venda.',
      context: PosSalePaymentsInsufficientError.name,
    });
  }
}
