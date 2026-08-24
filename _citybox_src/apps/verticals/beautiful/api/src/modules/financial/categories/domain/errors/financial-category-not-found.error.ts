import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialCategoryNotFoundError extends DomainError {
  constructor(context: string, categoryId: string) {
    super({
      internalMessage: `Financial category not found: ${categoryId}`,
      externalMessage: 'Categoria financeira não encontrada',
      context,
    });
  }
}
