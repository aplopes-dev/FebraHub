import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientReferralOriginNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Patient referral origin not found: ${id}`,
      externalMessage: 'Origem não encontrada',
      context,
    });
  }
}
