import { CustomerCategory } from '../domain/entities/customer-category.entity';
import {
  CustomerCategoryRepository,
  type CustomerCategoryListCriteria,
  type CustomerCategoryWithCustomerCount,
} from '../domain/repositories/customer-category.repository.interface';

export class InMemoryCustomerCategoryRepository extends CustomerCategoryRepository {
  private readonly items = new Map<string, CustomerCategory>();
  /** categoryId → customerIds (ativos) — preenchido pelos testes de customer. */
  private readonly customerLinks = new Map<string, Set<string>>();

  linkCustomer(categoryId: string, customerId: string): void {
    const set = this.customerLinks.get(categoryId) ?? new Set();
    set.add(customerId);
    this.customerLinks.set(categoryId, set);
  }

  unlinkCustomer(categoryId: string, customerId: string): void {
    this.customerLinks.get(categoryId)?.delete(customerId);
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<CustomerCategory | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<CustomerCategory | null> {
    const needle = name.trim().toLowerCase();
    for (const item of this.items.values()) {
      if (
        item.organizationId === organizationId &&
        item.name.toLowerCase() === needle
      ) {
        return item;
      }
    }
    return null;
  }

  async findAll(
    organizationId: string,
    criteria: CustomerCategoryListCriteria = {},
  ): Promise<CustomerCategory[]> {
    return this.filter(organizationId, criteria);
  }

  async findAllWithCustomerCounts(
    organizationId: string,
    criteria: CustomerCategoryListCriteria = {},
  ): Promise<CustomerCategoryWithCustomerCount[]> {
    const categories = this.filter(organizationId, criteria);
    return Promise.all(
      categories.map(async (category) => ({
        category,
        customerCount: await this.countCustomers(organizationId, category.id),
      })),
    );
  }

  async count(
    organizationId: string,
    criteria: Pick<CustomerCategoryListCriteria, 'search'> = {},
  ): Promise<number> {
    return this.filter(organizationId, criteria).length;
  }

  async countCustomers(
    _organizationId: string,
    categoryId: string,
  ): Promise<number> {
    return this.customerLinks.get(categoryId)?.size ?? 0;
  }

  async save(category: CustomerCategory): Promise<CustomerCategory> {
    this.items.set(category.id, category);
    return category;
  }

  async delete(_organizationId: string, id: string): Promise<void> {
    this.items.delete(id);
    this.customerLinks.delete(id);
  }

  private filter(
    organizationId: string,
    criteria: CustomerCategoryListCriteria,
  ): CustomerCategory[] {
    const search = criteria.search?.trim().toLowerCase();
    let list = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    if (search) {
      list = list.filter((item) => item.name.toLowerCase().includes(search));
    }

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    return take === undefined
      ? list.slice(skip)
      : list.slice(skip, skip + take);
  }
}
