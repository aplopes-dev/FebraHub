import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class InvalidTeamMemberRoleError extends ValidatorDomainError {
  constructor(context: string, value: string) {
    super({
      internalMessage: `Invalid team member role: ${value}`,
      externalMessage:
        'Perfil de usuário inválido. Use administrador, corretor, corretor filiado ou assistente',
      context,
    });
  }
}
