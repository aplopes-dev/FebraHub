import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosSaleOperatorInvalidError extends DomainError {
  constructor(operatorId: string) {
    super({
      internalMessage: `PosOperator ${operatorId} is missing, inactive, deleted or not on this branch`,
      externalMessage:
        'Operador inválido para este terminal. Faça login novamente.',
      context: PosSaleOperatorInvalidError.name,
    });
  }
}
