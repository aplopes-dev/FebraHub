import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProfessionalOutsideWorkScheduleError extends DomainError {
  constructor(professionalId: string) {
    super({
      internalMessage: `Appointment outside work schedule for professional ${professionalId}`,
      externalMessage:
        'O horário escolhido está fora da disponibilidade do profissional.',
      context: 'Appointments',
    });
  }
}
