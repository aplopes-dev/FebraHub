import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AppointmentSlotTakenError extends DomainError {
  constructor(professionalId: string) {
    super({
      internalMessage: `Appointment slot overlap for professional ${professionalId}`,
      externalMessage:
        'Já existe um agendamento neste horário para o profissional.',
      context: 'Appointments',
    });
  }
}
