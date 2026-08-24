import { InMemoryBranchRepository } from '../../tenancy/tests/in-memory-branch.repository';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
} from '../../tenancy/tests/tenancy-test-factory';
import {
  MovementCategory,
  type MovementCategoryType,
} from '../domain/entities/movement-category.entity';
import { InMemoryMovementCategoryRepository } from './in-memory-movement-category.repository';

export const MOVEMENT_CATEGORY_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
export const OTHER_MOVEMENT_CATEGORY_ID =
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

type MovementCategoryOverrides = Partial<{
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: MovementCategoryType;
  systemKey: string | null;
  isSystem: boolean;
  branchIds: string[];
}>;

export function makeMovementCategory(
  overrides: MovementCategoryOverrides = {},
): MovementCategory {
  return MovementCategory.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      code: overrides.code ?? 'CM-010',
      name: overrides.name ?? 'Categoria teste',
      type: overrides.type ?? 'saida',
      systemKey: overrides.systemKey ?? null,
      isSystem: overrides.isSystem ?? false,
      branchIds: overrides.branchIds ?? [BRANCH_ID],
    },
    overrides.id ?? MOVEMENT_CATEGORY_ID,
  );
}

export function makeRepositories() {
  return {
    movementCategoryRepository: new InMemoryMovementCategoryRepository(),
    branchRepository: new InMemoryBranchRepository(),
  };
}
