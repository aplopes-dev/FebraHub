import { ClientCategoryEntity } from '../domain/entities/client-category.entity';
import { ClientCategoryRepository } from '../domain/repositories/client-category.repository.interface';

export class InMemoryClientCategoryRepository implements ClientCategoryRepository {
  public items: ClientCategoryEntity[] = [];

  async save(category: ClientCategoryEntity): Promise<void> {
    const index = this.items.findIndex((item) => item.id === category.id);
    if (index >= 0) this.items[index] = category;
    else this.items.push(category);
    await Promise.resolve();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<ClientCategoryEntity | null> {
    await Promise.resolve();
    return (
      this.items.find((item) => item.id === id && item.storeId === storeId) ??
      null
    );
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<ClientCategoryEntity | null> {
    await Promise.resolve();
    return (
      this.items.find(
        (item) => item.storeId === storeId && item.name === name,
      ) ?? null
    );
  }

  async findAll(storeId: string): Promise<ClientCategoryEntity[]> {
    await Promise.resolve();
    return this.items
      .filter((item) => item.storeId === storeId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async delete(storeId: string, id: string): Promise<void> {
    this.items = this.items.filter(
      (item) => !(item.id === id && item.storeId === storeId),
    );
    await Promise.resolve();
  }
}
