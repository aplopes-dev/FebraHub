import {
  CUSTOMER_STAGES,
  Customer,
  type CustomerStageValue,
} from '../domain/entities/customer.entity';
import {
  CustomerRepository,
  type CustomerListCriteria,
} from '../domain/repositories/customer.repository.interface';

export class InMemoryCustomerRepository extends CustomerRepository {
  private readonly items = new Map<string, Customer>();

  async findById(organizationId: string, id: string): Promise<Customer | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  async findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Customer | null> {
    for (const item of this.items.values()) {
      if (
        item.organizationId === organizationId &&
        item.document === document
      ) {
        return item;
      }
    }
    return null;
  }

  async findAll(
    organizationId: string,
    criteria: CustomerListCriteria = {},
  ): Promise<Customer[]> {
    return this.filter(organizationId, criteria);
  }

  async count(
    organizationId: string,
    criteria: CustomerListCriteria = {},
  ): Promise<number> {
    return this.filter(organizationId, {
      ...criteria,
      skip: 0,
      take: undefined,
    }).length;
  }

  async countByStage(
    organizationId: string,
  ): Promise<Record<CustomerStageValue, number>> {
    const result = Object.fromEntries(
      CUSTOMER_STAGES.map((stage) => [stage, 0]),
    ) as Record<CustomerStageValue, number>;

    for (const item of this.items.values()) {
      if (item.organizationId !== organizationId || item.deletedAt) continue;
      result[item.stage] += 1;
    }
    return result;
  }

  async save(customer: Customer): Promise<Customer> {
    this.items.set(customer.id, customer);
    return customer;
  }

  private filter(
    organizationId: string,
    criteria: CustomerListCriteria,
  ): Customer[] {
    const search = criteria.search?.trim().toLowerCase();
    const digits = search?.replace(/\D/g, '') ?? '';
    const tab = criteria.tab ?? 'all';

    let list = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .filter((item) => !item.deletedAt)
      .filter((item) => (tab === 'all' ? true : item.stage === tab))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (search) {
      list = list.filter((item) => {
        const phone = item.primaryPhone.toLowerCase();
        const phoneDigits = item.primaryPhone.replace(/\D/g, '');
        return (
          item.name.toLowerCase().includes(search) ||
          (item.email ?? '').toLowerCase().includes(search) ||
          phone.includes(search) ||
          (digits.length > 0 && phoneDigits.includes(digits))
        );
      });
    }

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    if (take === undefined) return list.slice(skip);
    return list.slice(skip, skip + take);
  }
}
