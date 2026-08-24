import type { Customer } from '../entities/customer.entity';

export abstract class CustomerRepository {
  abstract findById(id: string): Promise<Customer | null>;
  abstract findByDocument(
    companyId: string,
    document: string,
  ): Promise<Customer | null>;
  abstract save(customer: Customer): Promise<Customer>;
}
