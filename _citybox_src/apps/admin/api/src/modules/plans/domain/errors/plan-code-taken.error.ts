import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PlanCodeTakenError extends DomainError {
  constructor(context: string, code: string) {
    super({
      internalMessage: `Duplicate plan code: ${code}`,
      externalMessage: 'Este código já está em uso',
      context,
    });
  }
}
