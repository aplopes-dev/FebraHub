import { DomainError } from '../../../../shared/core/errors/domain.error';

export class UserNotFoundError extends DomainError {
  constructor(context: string, userId: string) {
    super({
      internalMessage: `PlatformUser "${userId}" not found`,
      externalMessage: 'Usuário não encontrado',
      context,
    });
  }
}
