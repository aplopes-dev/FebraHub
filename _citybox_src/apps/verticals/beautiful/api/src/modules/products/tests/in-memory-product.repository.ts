import {
  ProductRepository,
  ListProductsFilter,
} from '../domain/repositories/product.repository.interface';
import { ProductEntity } from '../domain/entities/product.entity';

export class InMemoryProductRepository implements ProductRepository {
  public items: ProductEntity[] = [];

  async save(product: ProductEntity): Promise<void> {
    const index = this.items.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      this.items[index] = product;
    } else {
      this.items.push(product);
    }
    await Promise.resolve();
  }

  async findById(storeId: string, id: string): Promise<ProductEntity | null> {
    const item = this.items.find((i) => i.id === id && i.storeId === storeId);
    await Promise.resolve();
    return item || null;
  }

  async findAll(
    storeId: string,
    filter?: ListProductsFilter,
  ): Promise<ProductEntity[]> {
    await Promise.resolve();
    return this.items.filter((item) => {
      if (item.storeId !== storeId) return false;
      if (filter?.active !== undefined && item.active !== filter.active) {
        return false;
      }
      if (filter?.search) {
        const search = filter.search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(search);
        const matchSku = item.sku.toLowerCase().includes(search);
        const matchUnit = item.unitOfMeasure.toLowerCase().includes(search);
        const matchDesc = item.description?.toLowerCase().includes(search);
        return matchName || matchSku || matchUnit || Boolean(matchDesc);
      }
      return true;
    });
  }

  async findPaginated(
    storeId: string,
    filter: ListProductsFilter,
    pagination: { page: number; perPage: number },
  ): Promise<{ items: ProductEntity[]; total: number }> {
    const filtered = await this.findAll(storeId, filter);
    const sorted = [...filtered].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const skip = (pagination.page - 1) * pagination.perPage;
    return {
      items: sorted.slice(skip, skip + pagination.perPage),
      total: sorted.length,
    };
  }

  async delete(storeId: string, id: string): Promise<void> {
    this.items = this.items.filter(
      (item) => !(item.id === id && item.storeId === storeId),
    );
    await Promise.resolve();
  }
}
