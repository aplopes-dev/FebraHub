import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AppointmentStatusLockedError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Appointment ${id} is COMPLETED and status cannot change.`,
      externalMessage:
        'Atendimentos concluídos não podem ter o status alterado.',
      context: 'Appointments',
    });
  }
}
