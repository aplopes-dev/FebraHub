import { DomainError } from '../../../../shared/core/errors/domain.error';

export class MembershipNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Membership ${id} not found in the current organization`,
      externalMessage: 'Membro não encontrado',
      context: MembershipNotFoundError.name,
    });
  }
}
