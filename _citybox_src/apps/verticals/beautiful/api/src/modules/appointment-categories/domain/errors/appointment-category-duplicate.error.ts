import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AppointmentCategoryDuplicateError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Appointment category name already exists: ${name}`,
      externalMessage: 'Já existe uma categoria de agendamento com este nome.',
      context: 'AppointmentCategories',
    });
  }
}
