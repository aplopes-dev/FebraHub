import { DomainError } from '../../../../shared/core/errors/domain.error';
import type { AppointmentStatus } from '../appointment.types';

export class AppointmentNotEditableError extends DomainError {
  constructor(id: string, status: AppointmentStatus) {
    super({
      internalMessage: `Appointment ${id} with status ${status} cannot be edited.`,
      externalMessage:
        status === 'COMPLETED'
          ? 'Atendimentos concluídos não podem ser editados ou remarcados.'
          : 'Este agendamento não pode ser editado no status atual.',
      context: 'Appointments',
    });
  }
}
