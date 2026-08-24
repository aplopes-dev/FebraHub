import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientCategoryHasPatientsError extends DomainError {
  constructor(context: string, categoryId: string) {
    super({
      internalMessage: `Patient category has linked patients: ${categoryId}`,
      externalMessage:
        'Não é possível excluir uma categoria com pacientes vinculados',
      context,
    });
  }
}
