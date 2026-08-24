import {
  StoreRepository,
  type StoreListCriteria,
} from '../domain/repositories/store.repository.interface';
import { Store } from '../domain/entities/store.entity';
import type {} from '../domain/entities/store.entity';

export class InMemoryStoreRepository extends StoreRepository {
  private items: Store[] = [];

  async findById(id: string): Promise<Store | null> {
    return this.items.find((store) => store.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    return this.items.find((store) => store.slug === slug) ?? null;
  }

  async findByGatewayCustomerId(
    gatewayCustomerId: string,
  ): Promise<Store | null> {
    return (
      this.items.find(
        (store) => store.gatewayCustomerId === gatewayCustomerId,
      ) ?? null
    );
  }

  async findAll(criteria?: StoreListCriteria): Promise<Store[]> {
    let result = this.applyFilters(criteria);
    if (criteria?.skip) result = result.slice(criteria.skip);
    if (criteria?.take !== undefined) result = result.slice(0, criteria.take);
    return result;
  }

  async count(criteria?: StoreListCriteria): Promise<number> {
    return this.applyFilters(criteria).length;
  }

  async save(store: Store): Promise<Store> {
    const index = this.items.findIndex((item) => item.id === store.id);
    if (index >= 0) {
      this.items[index] = store;
    } else {
      this.items.push(store);
    }
    return store;
  }

  getAll(): Store[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }

  private applyFilters(criteria?: StoreListCriteria): Store[] {
    let result = [...this.items];
    const search = criteria?.search?.trim().toLowerCase();

    if (criteria?.status?.length) {
      result = result.filter((store) =>
        criteria.status!.includes(store.status),
      );
    }

    if (criteria?.vertical?.length) {
      result = result.filter((store) =>
        criteria.vertical!.includes(store.vertical),
      );
    }

    if (criteria?.createdFrom) {
      result = result.filter(
        (store) => store.createdAt >= criteria.createdFrom!,
      );
    }

    if (criteria?.createdTo) {
      result = result.filter((store) => store.createdAt <= criteria.createdTo!);
    }

    if (search) {
      // Espelha o repositório Prisma: busca por nome fantasia, slug e responsável.
      result = result.filter((store) => {
        const haystack = [
          store.tradeName,
          store.slug,
          store.responsibleName ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    return result;
  }
}
