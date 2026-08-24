import type { Customer, CustomerStageValue } from '../entities/customer.entity';

export const CUSTOMER_LIST_TABS = [
  'all',
  'lead',
  'opportunity',
  'active',
  'inactive',
] as const;
export type CustomerListTab = (typeof CUSTOMER_LIST_TABS)[number];

export type CustomerListCriteria = {
  search?: string;
  tab?: CustomerListTab;
  skip?: number;
  take?: number;
};

export abstract class CustomerRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<Customer | null>;
  abstract findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Customer | null>;
  abstract findAll(
    organizationId: string,
    criteria?: CustomerListCriteria,
  ): Promise<Customer[]>;
  abstract count(
    organizationId: string,
    criteria?: CustomerListCriteria,
  ): Promise<number>;
  abstract countByStage(
    organizationId: string,
  ): Promise<Record<CustomerStageValue, number>>;
  abstract save(customer: Customer): Promise<Customer>;
}
