import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvalidAppointmentIntervalError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'Appointment endsAt must be after startsAt',
      externalMessage: 'O horário de término deve ser posterior ao de início.',
      context,
    });
  }
}
