import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientAnamnesisAlreadySubmittedError extends DomainError {
  constructor(context: string, anamnesisId: string) {
    super({
      internalMessage: `Patient anamnesis already submitted: ${anamnesisId}`,
      externalMessage: 'Esta anamnese já foi preenchida',
      context,
    });
  }
}
