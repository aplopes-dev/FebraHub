import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ReferencedAppointmentCategoryNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Appointment category not found: ${id}`,
      externalMessage: 'Categoria de agendamento não encontrada.',
      context: 'Appointments',
    });
  }
}
