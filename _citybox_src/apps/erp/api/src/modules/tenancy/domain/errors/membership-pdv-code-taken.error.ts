import { DomainError } from '../../../../shared/core/errors/domain.error';

export class MembershipPdvCodeTakenError extends DomainError {
  constructor(code: string) {
    super({
      internalMessage: `PDV code "${code}" is already used by another membership`,
      externalMessage: `Já existe um membro com o código PDV "${code}" nesta organização`,
      context: MembershipPdvCodeTakenError.name,
    });
  }
}
