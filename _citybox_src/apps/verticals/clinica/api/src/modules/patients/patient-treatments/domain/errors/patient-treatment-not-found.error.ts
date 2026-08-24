import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientTreatmentNotFoundError extends DomainError {
  constructor(context: string, treatmentId: string) {
    super({
      internalMessage: `Patient treatment not found: ${treatmentId}`,
      externalMessage: 'Procedimento não encontrado',
      context,
    });
  }
}
