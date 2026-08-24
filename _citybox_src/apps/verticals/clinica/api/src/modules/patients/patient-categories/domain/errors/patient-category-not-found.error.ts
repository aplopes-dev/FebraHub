import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientCategoryNotFoundError extends DomainError {
  constructor(context: string, categoryId: string) {
    super({
      internalMessage: `Patient category not found: ${categoryId}`,
      externalMessage: 'Categoria de paciente não encontrada',
      context,
    });
  }
}
