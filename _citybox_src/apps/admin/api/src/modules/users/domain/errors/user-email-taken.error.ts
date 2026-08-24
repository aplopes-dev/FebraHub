import { DomainError } from '../../../../shared/core/errors/domain.error';

export class UserEmailTakenError extends DomainError {
  constructor(context: string, email: string) {
    super({
      internalMessage: `Attempt to register duplicate email: ${email}`,
      externalMessage: 'Este e-mail já está em uso',
      context,
    });
  }
}
