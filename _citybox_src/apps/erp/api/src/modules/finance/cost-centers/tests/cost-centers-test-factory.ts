import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tenancy/tests/tenancy-test-factory';
import { CostCenter } from '../domain/entities/cost-center.entity';
import { InMemoryCostCenterRepository } from './in-memory-cost-center.repository';

export { ORGANIZATION_ID, OTHER_ORGANIZATION_ID };

export const COST_CENTER_ID = 'f1111111-1111-4111-8111-111111111111';
export const OTHER_COST_CENTER_ID = 'f2222222-2222-4222-8222-222222222222';

export function makeCostCenter(
  overrides: Partial<{
    id: string;
    organizationId: string;
    name: string;
    systemKey: string | null;
    isSystem: boolean;
  }> = {},
): CostCenter {
  return CostCenter.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      name: overrides.name ?? 'Administrativo',
      systemKey: overrides.systemKey ?? null,
      isSystem: overrides.isSystem ?? false,
    },
    overrides.id ?? COST_CENTER_ID,
  );
}

export function makeCostCenterRepositories() {
  return {
    costCenterRepository: new InMemoryCostCenterRepository(),
  };
}
