import type { CustomerCategory } from '../entities/customer-category.entity';

export type CustomerCategoryListCriteria = {
  search?: string;
  skip?: number;
  take?: number;
};

export type CustomerCategoryWithCustomerCount = {
  category: CustomerCategory;
  customerCount: number;
};

export abstract class CustomerCategoryRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<CustomerCategory | null>;
  abstract findByName(
    organizationId: string,
    name: string,
  ): Promise<CustomerCategory | null>;
  abstract findAll(
    organizationId: string,
    criteria?: CustomerCategoryListCriteria,
  ): Promise<CustomerCategory[]>;
  abstract findAllWithCustomerCounts(
    organizationId: string,
    criteria?: CustomerCategoryListCriteria,
  ): Promise<CustomerCategoryWithCustomerCount[]>;
  abstract count(
    organizationId: string,
    criteria?: Pick<CustomerCategoryListCriteria, 'search'>,
  ): Promise<number>;
  abstract countCustomers(
    organizationId: string,
    categoryId: string,
  ): Promise<number>;
  abstract save(category: CustomerCategory): Promise<CustomerCategory>;
  abstract delete(organizationId: string, id: string): Promise<void>;
}
