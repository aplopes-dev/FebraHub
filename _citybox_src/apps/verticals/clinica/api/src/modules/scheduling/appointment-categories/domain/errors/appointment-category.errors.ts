import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class AppointmentCategoryNotFoundError extends DomainError {
  constructor(context: string, categoryId: string) {
    super({
      internalMessage: `Appointment category not found: ${categoryId}`,
      externalMessage: 'Categoria de agendamento não encontrada',
      context,
    });
  }
}

export class AppointmentCategoryNameTakenError extends DomainError {
  constructor(context: string, name: string) {
    super({
      internalMessage: `Appointment category name taken: ${name}`,
      externalMessage: 'Já existe uma categoria com este nome',
      context,
    });
  }
}

export class AppointmentCategoryHasAppointmentsError extends DomainError {
  constructor(context: string, categoryId: string) {
    super({
      internalMessage: `Appointment category has linked appointments: ${categoryId}`,
      externalMessage:
        'Não é possível excluir uma categoria com consultas vinculadas',
      context,
    });
  }
}
