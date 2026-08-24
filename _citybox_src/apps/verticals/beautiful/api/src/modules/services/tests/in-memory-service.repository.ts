import {
  ServiceRepository,
  ListServicesFilter,
} from '../domain/repositories/service.repository.interface';
import { ServiceEntity } from '../domain/entities/service.entity';

export class InMemoryServiceRepository implements ServiceRepository {
  public items: ServiceEntity[] = [];

  async save(service: ServiceEntity): Promise<void> {
    const index = this.items.findIndex((item) => item.id === service.id);
    if (index >= 0) {
      this.items[index] = service;
    } else {
      this.items.push(service);
    }
    await Promise.resolve();
  }

  async findById(storeId: string, id: string): Promise<ServiceEntity | null> {
    const item = this.items.find((i) => i.id === id && i.storeId === storeId);
    await Promise.resolve();
    return item || null;
  }

  async findAll(
    storeId: string,
    filter?: ListServicesFilter,
  ): Promise<ServiceEntity[]> {
    await Promise.resolve();
    return this.items.filter((item) => {
      if (item.storeId !== storeId) return false;
      if (filter?.active !== undefined && item.active !== filter.active) {
        return false;
      }
      if (
        filter?.category &&
        filter.category !== 'all' &&
        !item.categories.includes(filter.category)
      ) {
        return false;
      }
      if (filter?.search) {
        const search = filter.search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(search);
        const matchCat = item.categories.some((c) =>
          c.toLowerCase().includes(search),
        );
        const matchDesc = item.description?.toLowerCase().includes(search);
        return matchName || matchCat || Boolean(matchDesc);
      }
      return true;
    });
  }

  async findPaginated(
    storeId: string,
    filter: ListServicesFilter,
    pagination: { page: number; perPage: number },
  ): Promise<{ items: ServiceEntity[]; total: number }> {
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
