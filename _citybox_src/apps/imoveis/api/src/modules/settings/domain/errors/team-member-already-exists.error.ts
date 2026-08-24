import { DomainError } from '../../../../shared/core/errors/domain.error';

export class TeamMemberAlreadyExistsError extends DomainError {
  constructor(context: string, email: string) {
    super({
      internalMessage: `Team member already exists: ${email}`,
      externalMessage: 'Já existe um usuário com este e-mail',
      context,
    });
  }
}
