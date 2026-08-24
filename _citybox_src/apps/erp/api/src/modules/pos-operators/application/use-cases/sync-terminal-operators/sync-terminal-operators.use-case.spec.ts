import {
  POS_OPERATOR_SYNC_TTL_HOURS,
  SyncTerminalOperatorsUseCase,
} from './sync-terminal-operators.use-case';
import { PdvCashierPresenter } from '../../../infrastructure/http/routes/shared/pdv-cashier.presenter';
import { PinHasher } from '../../../../../shared/infra/crypto/pin-hasher';
import {
  BRANCH_ID,
  MEMBERSHIP_ID,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  USER_ID,
  makeMembership,
  makeRepositories,
  makeUser,
} from '../../../../tenancy/tests/tenancy-test-factory';

const PIN = '1234';
const PROFILE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_MEMBERSHIP_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OTHER_USER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('SyncTerminalOperatorsUseCase', () => {
  async function build() {
    const repos = makeRepositories();
    repos.membershipRepository.registerPermissionProfile({
      id: PROFILE_ID,
      name: 'Caixa',
      systemKey: 'caixa',
      permissionIds: ['pdv.operacao.venda.create'],
    });
    await repos.seedOwner();
    return {
      repos,
      useCase: new SyncTerminalOperatorsUseCase(repos.membershipRepository),
    };
  }

  async function seedCashier(
    repos: Awaited<ReturnType<typeof build>>['repos'],
    overrides: {
      membershipId?: string;
      userId?: string;
      code?: string;
      name?: string;
      active?: boolean;
      branchIds?: string[];
    } = {},
  ) {
    const membershipId = overrides.membershipId ?? MEMBERSHIP_ID;
    const userId = overrides.userId ?? USER_ID;
    await repos.userRepository.save(
      makeUser({
        id: userId,
        name: overrides.name ?? 'Maria Souza',
        email: `${userId}@lojailheus.com.br`,
        keycloakSub: `kc-${userId}`,
      }),
    );
    await repos.membershipRepository.save(
      makeMembership({
        id: membershipId,
        userId,
        permissionProfileId: PROFILE_ID,
        active: overrides.active ?? true,
        pdvCode: overrides.code ?? '01',
        pdvPinHash: await PinHasher.hash(PIN),
      }),
    );
    await repos.membershipRepository.replaceBranchAccess(
      ORGANIZATION_ID,
      membershipId,
      overrides.branchIds ?? [BRANCH_ID],
    );
  }

  it('devolve os caixas elegíveis da unidade com o hash do PIN', async () => {
    const { repos, useCase } = await build();
    await seedCashier(repos, { code: '01', name: 'Maria Souza' });

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
    });

    expect(result.operators).toHaveLength(1);
    expect(result.operators[0].id).toBe(USER_ID);
    expect(result.operators[0].pinHash).toEqual(expect.stringContaining('$'));
    expect(result.operators[0].permissionIds).toContain(
      'pdv.operacao.venda.create',
    );
  });

  it('não devolve membro sem acesso à unidade', async () => {
    const { repos, useCase } = await build();
    await seedCashier(repos, { code: '01' });
    await seedCashier(repos, {
      membershipId: OTHER_MEMBERSHIP_ID,
      userId: OTHER_USER_ID,
      code: '02',
      branchIds: [OTHER_BRANCH_ID],
    });

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
    });

    expect(result.operators.map((o) => o.code)).toEqual(['01']);
  });

  it('não devolve membro inativo', async () => {
    const { repos, useCase } = await build();
    await seedCashier(repos, { code: '01', active: false });

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
    });

    expect(result.operators).toEqual([]);
  });

  it('carimba a validade em 48 h', async () => {
    const { useCase } = await build();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
    });

    const hours =
      (result.expiresAt.getTime() - result.syncedAt.getTime()) /
      (60 * 60 * 1000);
    expect(hours).toBeCloseTo(POS_OPERATOR_SYNC_TTL_HOURS, 5);
  });
});

describe('SEC-7 — pinHash só sai pelo pacote de sincronização', () => {
  it('o presenter de sincronização devolve o hash e permissionIds', () => {
    const now = new Date();
    const body = PdvCashierPresenter.toHttpSync({
      operators: [
        {
          id: USER_ID,
          membershipId: MEMBERSHIP_ID,
          code: '01',
          name: 'Maria',
          permissionIds: ['pdv.operacao.venda.create'],
          pinHash: '$scrypt$example',
        },
      ],
      syncedAt: now,
      expiresAt: now,
    });

    expect(body.data.operators[0].pinHash).toBe('$scrypt$example');
    expect(Object.keys(body.data.operators[0]).sort()).toEqual([
      'code',
      'id',
      'membershipId',
      'name',
      'permissionIds',
      'pinHash',
    ]);
  });

  it('o presenter de sessão do terminal não inclui pinHash', () => {
    const session = PdvCashierPresenter.toHttpSession({
      id: USER_ID,
      membershipId: MEMBERSHIP_ID,
      code: '01',
      name: 'Maria',
      permissionIds: ['pdv.operacao.venda.create'],
      active: true,
      locked: false,
      lockedUntil: null,
    });

    expect(Object.keys(session.data)).not.toContain('pinHash');
    expect(JSON.stringify(session)).not.toContain('pinHash');
  });
});
