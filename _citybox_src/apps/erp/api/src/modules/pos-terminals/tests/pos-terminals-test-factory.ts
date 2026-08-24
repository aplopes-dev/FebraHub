import { InMemoryBranchRepository } from '../../tenancy/tests/in-memory-branch.repository';
import { InMemoryMembershipRepository } from '../../tenancy/tests/in-memory-membership.repository';
import { InMemoryOrganizationRepository } from '../../tenancy/tests/in-memory-organization.repository';
import { InMemoryUserRepository } from '../../tenancy/tests/in-memory-user.repository';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
  makeBranch,
  makeOrganization,
} from '../../tenancy/tests/tenancy-test-factory';
import {
  PosTerminal,
  type PosTerminalStatusValue,
} from '../domain/entities/pos-terminal.entity';
import { InMemoryPosTerminalRepository } from './in-memory-pos-terminal.repository';

export { ORGANIZATION_ID, BRANCH_ID };

export const POS_TERMINAL_ID = 'e1111111-1111-4111-8111-111111111111';
export const OTHER_POS_TERMINAL_ID = 'e2222222-2222-4222-8222-222222222222';
export const OTHER_BRANCH_ID = '44444444-4444-4444-8444-444444444444';

type PosTerminalOverrides = Partial<{
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  status: PosTerminalStatusValue;
  printer: string | null;
  scale: string | null;
  nfceContingency: boolean;
  offlineServerId: string | null;
  deletedAt: Date | null;
}>;

export function makePosTerminal(
  overrides: PosTerminalOverrides = {},
): PosTerminal {
  const base = PosTerminal.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      branchId: overrides.branchId ?? BRANCH_ID,
      name: overrides.name ?? 'Caixa 1 — Balcão',
      status: overrides.status ?? 'active',
      printer: overrides.printer ?? null,
      scale: overrides.scale ?? null,
      nfceContingency: overrides.nfceContingency ?? false,
      offlineServerId: overrides.offlineServerId ?? null,
    },
    overrides.id ?? POS_TERMINAL_ID,
  );

  return overrides.deletedAt ? base.softDelete() : base;
}

export function makePosTerminalRepositories() {
  const userRepository = new InMemoryUserRepository();
  const membershipRepository = new InMemoryMembershipRepository(userRepository);
  const branchRepository = new InMemoryBranchRepository();
  const organizationRepository = new InMemoryOrganizationRepository(
    membershipRepository,
    branchRepository,
  );
  return {
    posTerminalRepository: new InMemoryPosTerminalRepository(),
    organizationRepository,
    branchRepository,
    async seedOrgAndBranch() {
      await organizationRepository.save(makeOrganization());
      await branchRepository.save(makeBranch());
    },
  };
}
