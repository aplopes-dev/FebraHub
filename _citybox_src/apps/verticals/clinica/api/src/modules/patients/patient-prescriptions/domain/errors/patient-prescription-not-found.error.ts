import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientPrescriptionNotFoundError extends DomainError {
  constructor(context: string, prescriptionId: string) {
    super({
      internalMessage: `Patient prescription not found: ${prescriptionId}`,
      externalMessage: 'Receituário não encontrado',
      context,
    });
  }
}
