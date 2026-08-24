import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AppointmentNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Appointment with ID "${id}" was not found.`,
      externalMessage: 'Agendamento não encontrado.',
      context: 'Appointments',
    });
  }
}
