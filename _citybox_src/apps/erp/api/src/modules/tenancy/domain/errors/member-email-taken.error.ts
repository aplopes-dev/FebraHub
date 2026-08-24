import { DomainError } from '../../../../shared/core/errors/domain.error';

export class MemberEmailTakenError extends DomainError {
  constructor(email: string) {
    super({
      internalMessage: `User ${email} is already a member of this organization`,
      externalMessage: `${email} já é membro desta organização`,
      context: MemberEmailTakenError.name,
    });
  }
}
