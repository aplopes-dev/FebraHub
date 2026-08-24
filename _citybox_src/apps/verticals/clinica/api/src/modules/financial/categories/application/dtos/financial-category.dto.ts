import type { FinancialCategory } from '../../domain/entities/financial-category.entity';
import type { FinancialCategoryKind } from '../../domain/entities/financial-category.entity';

export type ListFinancialCategoriesDto = {
  storeId: string;
  kind?: FinancialCategoryKind;
};

export type CreateFinancialCategoryDto = {
  storeId: string;
  kind: FinancialCategoryKind;
  name: string;
  color?: string;
};

export type UpdateFinancialCategoryDto = {
  storeId: string;
  categoryId: string;
  name?: string;
  color?: string;
};

export type DeleteFinancialCategoryDto = {
  storeId: string;
  categoryId: string;
};

export type ListFinancialCategoriesResult = {
  items: FinancialCategory[];
};
