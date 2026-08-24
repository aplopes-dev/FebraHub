import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientAnamnesisLinkExpiredError extends DomainError {
  constructor(context: string, anamnesisId: string) {
    super({
      internalMessage: `Patient anamnesis link expired: ${anamnesisId}`,
      externalMessage: 'O prazo para preenchimento desta anamnese encerrou',
      context,
    });
  }
}
