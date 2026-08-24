import type { PersonTypeValue } from '../../../shared/core/utils/document';
import { InMemoryBranchRepository } from '../../tenancy/tests/in-memory-branch.repository';
import {
  makeCnpj,
  ORGANIZATION_ID,
} from '../../tenancy/tests/tenancy-test-factory';
import { InMemoryCustomerCategoryRepository } from '../customer-categories/tests/in-memory-customer-category.repository';
import {
  Customer,
  type CustomerAddressInput,
  type CustomerStageValue,
} from '../domain/entities/customer.entity';
import { InMemoryCustomerRepository } from './in-memory-customer.repository';

export { ORGANIZATION_ID };

export const CUSTOMER_ID = 'd1111111-1111-4111-8111-111111111111';
export const OTHER_CUSTOMER_ID = 'd2222222-2222-4222-8222-222222222222';
export const CUSTOMER_CPF = '52998224725';
export const CUSTOMER_DOCUMENT = makeCnpj(20);

type CustomerOverrides = Partial<{
  id: string;
  organizationId: string;
  personType: PersonTypeValue;
  name: string;
  document: string | null;
  stage: CustomerStageValue;
  categoryId: string | null;
  email: string | null;
  mobilePhone: string | null;
  phone: string | null;
  branchIds: string[];
  addresses: CustomerAddressInput[];
  deletedAt: Date | null;
}>;

export function makeCustomer(overrides: CustomerOverrides = {}): Customer {
  return Customer.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      personType: overrides.personType ?? 'PF',
      name: overrides.name ?? 'Maria Silva',
      document:
        overrides.document === undefined ? CUSTOMER_CPF : overrides.document,
      email: overrides.email ?? 'maria@email.com',
      mobilePhone: overrides.mobilePhone ?? '73999887766',
      phone: overrides.phone ?? null,
      stage: overrides.stage ?? 'lead',
      categoryId: overrides.categoryId ?? null,
      branchIds: overrides.branchIds ?? [],
      addresses: overrides.addresses ?? [],
      deletedAt: overrides.deletedAt ?? null,
    },
    overrides.id ?? CUSTOMER_ID,
  );
}

export function makeCustomerRepositories() {
  return {
    customerRepository: new InMemoryCustomerRepository(),
    branchRepository: new InMemoryBranchRepository(),
    categoryRepository: new InMemoryCustomerCategoryRepository(),
  };
}
