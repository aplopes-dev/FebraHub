import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientAnamnesisNotFoundError extends DomainError {
  constructor(context: string, anamnesisId: string) {
    super({
      internalMessage: `Patient anamnesis not found: ${anamnesisId}`,
      externalMessage: 'Anamnese não encontrada',
      context,
    });
  }
}
