import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientTreatmentCompletedError extends DomainError {
  constructor(context: string, treatmentId: string) {
    super({
      internalMessage: `Patient treatment is completed: ${treatmentId}`,
      externalMessage: 'Procedimento finalizado não pode ser alterado',
      context,
    });
  }
}
