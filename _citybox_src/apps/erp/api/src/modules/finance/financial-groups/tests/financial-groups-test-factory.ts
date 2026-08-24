import { ORGANIZATION_ID } from '../../../tenancy/tests/tenancy-test-factory';
import {
  FinancialGroup,
  type FinancialGroupClassification,
  type FinancialGroupSign,
  type FinancialGroupType,
} from '../domain/entities/financial-group.entity';
import { InMemoryFinancialGroupRepository } from './in-memory-financial-group.repository';

export { ORGANIZATION_ID };

export const FINANCIAL_GROUP_ID = 'f1111111-1111-4111-8111-111111111111';
export const OTHER_FINANCIAL_GROUP_ID = 'f2222222-2222-4222-8222-222222222222';

export function makeFinancialGroup(
  overrides: Partial<{
    id: string;
    organizationId: string;
    name: string;
    type: FinancialGroupType;
    systemKey: string | null;
    isSystem: boolean;
    classification: FinancialGroupClassification;
    catalogOrder: number;
    sign: FinancialGroupSign | null;
  }> = {},
): FinancialGroup {
  return FinancialGroup.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      name: overrides.name ?? 'Vendas',
      type: overrides.type ?? 'receita',
      systemKey: overrides.systemKey ?? null,
      isSystem: overrides.isSystem ?? false,
      classification: overrides.classification ?? 'resultado',
      catalogOrder: overrides.catalogOrder ?? 0,
      sign: overrides.sign ?? null,
    },
    overrides.id ?? FINANCIAL_GROUP_ID,
  );
}

export function makeFinancialGroupRepositories() {
  return {
    groupRepository: new InMemoryFinancialGroupRepository(),
  };
}
