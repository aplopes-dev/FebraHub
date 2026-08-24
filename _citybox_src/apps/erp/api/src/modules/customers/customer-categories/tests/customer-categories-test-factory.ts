import { ORGANIZATION_ID } from '../../../tenancy/tests/tenancy-test-factory';
import { CustomerCategory } from '../domain/entities/customer-category.entity';
import { InMemoryCustomerCategoryRepository } from './in-memory-customer-category.repository';

export { ORGANIZATION_ID };

export const CUSTOMER_CATEGORY_ID = 'c1111111-1111-4111-8111-111111111111';
export const OTHER_CUSTOMER_CATEGORY_ID =
  'c2222222-2222-4222-8222-222222222222';

export function makeCustomerCategory(
  overrides: Partial<{
    id: string;
    organizationId: string;
    name: string;
    discountPercentage: number;
  }> = {},
): CustomerCategory {
  return CustomerCategory.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      name: overrides.name ?? 'VIP',
      discountPercentage: overrides.discountPercentage ?? 10,
    },
    overrides.id ?? CUSTOMER_CATEGORY_ID,
  );
}

export function makeCategoryRepositories() {
  return {
    categoryRepository: new InMemoryCustomerCategoryRepository(),
  };
}
