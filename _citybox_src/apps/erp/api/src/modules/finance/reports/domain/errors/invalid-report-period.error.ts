import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class InvalidReportPeriodError extends DomainError {
  constructor(from: string, to: string) {
    super({
      internalMessage: `Report period invalid: to (${to}) is before from (${from})`,
      externalMessage: 'A data final não pode ser anterior à data inicial',
      context: InvalidReportPeriodError.name,
    });
  }
}
