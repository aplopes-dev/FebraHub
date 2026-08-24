import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class InvalidStatementPeriodError extends DomainError {
  constructor(from: string, to: string) {
    super({
      internalMessage: `Statement period invalid: to (${to}) is before from (${from})`,
      externalMessage: 'A data final não pode ser anterior à data inicial',
      context: InvalidStatementPeriodError.name,
    });
  }
}
