import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class ExternalReferralProfessionalNameTakenError extends DomainError {
  constructor(context: string, name: string) {
    super({
      internalMessage: `External referral professional name taken: ${name}`,
      externalMessage: 'Já existe um profissional externo com este nome',
      context,
    });
  }
}
