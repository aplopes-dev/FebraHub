import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PatientReferralInvalidError extends DomainError {
  constructor(context: string, externalMessage: string) {
    super({
      internalMessage: `Invalid patient referral: ${externalMessage}`,
      externalMessage,
      context,
    });
  }
}
