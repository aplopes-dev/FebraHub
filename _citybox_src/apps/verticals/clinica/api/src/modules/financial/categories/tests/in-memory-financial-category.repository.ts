import {
  FinancialCategory,
  type FinancialCategoryKind,
} from '../domain/entities/financial-category.entity';
import { FinancialCategoryRepository } from '../domain/repositories/financial-category.repository.interface';

export class InMemoryFinancialCategoryRepository extends FinancialCategoryRepository {
  private items: FinancialCategory[] = [];

  seed(categories: FinancialCategory[]): void {
    this.items = [...categories];
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<FinancialCategory | null> {
    return (
      this.items.find(
        (item) => item.id === id && item.storeId === storeId,
      ) ?? null
    );
  }

  async findMany(
    storeId: string,
    options?: { kind?: FinancialCategoryKind },
  ): Promise<FinancialCategory[]> {
    return this.items
      .filter((item) => item.storeId === storeId)
      .filter((item) => (options?.kind ? item.kind === options.kind : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async save(category: FinancialCategory): Promise<FinancialCategory> {
    const index = this.items.findIndex((item) => item.id === category.id);
    if (index === -1) {
      this.items = [...this.items, category];
    } else {
      this.items = this.items.map((item) =>
        item.id === category.id ? category : item,
      );
    }
    return category;
  }

  async delete(storeId: string, id: string): Promise<void> {
    this.items = this.items.filter(
      (item) => !(item.id === id && item.storeId === storeId),
    );
  }
}
