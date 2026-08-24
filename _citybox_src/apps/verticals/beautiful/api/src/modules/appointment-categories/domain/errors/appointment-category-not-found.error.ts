import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AppointmentCategoryNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Appointment category not found: ${id}`,
      externalMessage: 'Categoria de agendamento não encontrada.',
      context: 'AppointmentCategories',
    });
  }
}
