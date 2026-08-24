import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class InvalidCurrentPasswordError extends ValidatorDomainError {
  constructor(context: string, agentId: string) {
    super({
      internalMessage: `Invalid current password for agent: ${agentId}`,
      externalMessage: 'Senha atual incorreta',
      context,
    });
  }
}
