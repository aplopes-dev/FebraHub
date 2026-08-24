import { DomainError } from '../../../../shared/core/errors/domain.error';

export class AppointmentCategoryInUseError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Appointment category in use: ${id}`,
      externalMessage:
        'Não é possível excluir: existem agendamentos vinculados a esta categoria.',
      context: 'AppointmentCategories',
    });
  }
}
