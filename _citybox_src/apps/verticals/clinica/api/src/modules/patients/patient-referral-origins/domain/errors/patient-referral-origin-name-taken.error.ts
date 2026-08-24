import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientReferralOriginNameTakenError extends DomainError {
  constructor(context: string, name: string) {
    super({
      internalMessage: `Patient referral origin name taken: ${name}`,
      externalMessage: 'Já existe uma origem com este nome',
      context,
    });
  }
}
