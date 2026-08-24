import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PatientNotFoundError extends DomainError {
  constructor(context: string, patientId: string) {
    super({
      internalMessage: `Patient not found: ${patientId}`,
      externalMessage: 'Paciente não encontrado',
      context,
    });
  }
}
