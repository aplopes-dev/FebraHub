import { DomainError } from '../../../../shared/core/errors/domain.error';

export class UserNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `User ${id} not found`,
      externalMessage: 'Usuário não encontrado',
      context: UserNotFoundError.name,
    });
  }
}
