import type { FinancialCategory } from '../entities/financial-category.entity';
import type { FinancialCategoryKind } from '../entities/financial-category.entity';

export abstract class FinancialCategoryRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<FinancialCategory | null>;

  abstract findMany(
    storeId: string,
    options?: { kind?: FinancialCategoryKind },
  ): Promise<FinancialCategory[]>;

  abstract save(category: FinancialCategory): Promise<FinancialCategory>;

  abstract delete(storeId: string, id: string): Promise<void>;
}
