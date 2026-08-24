import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosSaleSupervisorRequiredError extends DomainError {
  constructor(operation: 'cancel' | 'discount' = 'cancel') {
    const internal =
      operation === 'discount'
        ? 'PosSale discount requires supervisor authorization'
        : 'PosSale cancel requires supervisor authorization';
    super({
      internalMessage: internal,
      externalMessage:
        'Esta operação exige autorização de um supervisor. Peça o PIN de quem tem alçada.',
      context: PosSaleSupervisorRequiredError.name,
    });
  }
}
