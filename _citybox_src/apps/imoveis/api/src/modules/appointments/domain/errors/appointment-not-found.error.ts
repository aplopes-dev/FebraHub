import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AppointmentNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Appointment not found: id=${id}`,
      externalMessage: 'Compromisso não encontrado.',
      context: 'AppointmentNotFoundError',
    });
  }
}
