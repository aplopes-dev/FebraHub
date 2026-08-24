import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientCategoryIsProtectedError extends DomainError {
  constructor(context: string, categoryId: string) {
    super({
      internalMessage: `Protected patient category cannot be deleted: ${categoryId}`,
      externalMessage: 'A categoria padrão protegida não pode ser excluída',
      context,
    });
  }
}
