import { CustomerRepository } from '../domain/repositories/customer.repository.interface';
import type { Customer } from '../domain/entities/customer.entity';

export class InMemoryCustomerRepository extends CustomerRepository {
  private readonly customers = new Map<string, Customer>();

  findById(id: string): Promise<Customer | null> {
    return Promise.resolve(this.customers.get(id) ?? null);
  }

  findByDocument(
    companyId: string,
    document: string,
  ): Promise<Customer | null> {
    const found = [...this.customers.values()].find(
      (c) => c.companyId === companyId && c.document === document,
    );
    return Promise.resolve(found ?? null);
  }

  save(customer: Customer): Promise<Customer> {
    this.customers.set(customer.id, customer);
    return Promise.resolve(customer);
  }
}
