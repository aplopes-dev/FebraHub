import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class ExternalReferralProfessionalNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `External referral professional not found: ${id}`,
      externalMessage: 'Profissional externo não encontrado',
      context,
    });
  }
}
