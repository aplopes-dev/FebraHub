import type { FinancialCategory } from '../../../../domain/entities/financial-category.entity';

export function toFinancialCategoryResponse(category: FinancialCategory) {
  return {
    id: category.id,
    kind: category.kind,
    name: category.name,
    color: category.color,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
