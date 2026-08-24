import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CommitmentOverlapsInProgressAppointmentError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage:
        'Cannot place commitment over an in-progress appointment',
      externalMessage:
        'Não é possível marcar o compromisso: há consulta em andamento neste horário',
      context,
    });
  }
}
