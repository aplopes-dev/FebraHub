import { AuthenticatePosOperatorUseCase } from './authenticate-pos-operator.use-case';
import { ListTerminalOperatorsUseCase } from '../list-terminal-operators/list-terminal-operators.use-case';
import { PinHasher } from '../../../../../shared/infra/crypto/pin-hasher';
import { MEMBERSHIP_PDV_MAX_ATTEMPTS } from '../../../../tenancy/domain/entities/membership.entity';
import { SetMemberPdvPinUseCase } from '../../../../tenancy/application/use-cases/set-member-pdv-pin/set-member-pdv-pin.use-case';
import { PosOperatorCredentialsUnauthorizedError } from '../../../domain/errors/pos-operator-credentials-unauthorized.error';
import { PosOperatorLockedError } from '../../../domain/errors/pos-operator-locked.error';
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

describe('AuthenticatePosOperatorUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    repos.membershipRepository.registerPermissionProfile({
      id: PROFILE_ID,
      name: 'Caixa',
      systemKey: 'caixa',
      permissionIds: ['pdv.operacao.venda.create'],
    });
    await repos.seedOwner();

    return {
      ...repos,
      useCase: new AuthenticatePosOperatorUseCase(repos.membershipRepository),
      setPin: new SetMemberPdvPinUseCase(repos.membershipRepository),
      listForTerminal: new ListTerminalOperatorsUseCase(
        repos.membershipRepository,
      ),
    };
  }

  async function seedCashier(
    ctx: Awaited<ReturnType<typeof setup>>,
    overrides: {
      membershipId?: string;
      userId?: string;
      code?: string;
      name?: string;
      active?: boolean;
      branchIds?: string[];
      permissionIds?: string[];
    } = {},
  ) {
    const membershipId = overrides.membershipId ?? MEMBERSHIP_ID;
    const userId = overrides.userId ?? USER_ID;
    if (overrides.permissionIds) {
      ctx.membershipRepository.registerPermissionProfile({
        id: PROFILE_ID,
        name: 'Caixa',
        systemKey: 'caixa',
        permissionIds: overrides.permissionIds,
      });
    }
    await ctx.userRepository.save(
      makeUser({
        id: userId,
        name: overrides.name ?? 'Maria Caixa',
        email: `${userId}@lojailheus.com.br`,
        keycloakSub: `kc-${userId}`,
      }),
    );
    await ctx.membershipRepository.save(
      makeMembership({
        id: membershipId,
        userId,
        permissionProfileId: PROFILE_ID,
        active: overrides.active ?? true,
        pdvCode: overrides.code ?? '01',
        pdvPinHash: await PinHasher.hash(PIN),
      }),
    );
    await ctx.membershipRepository.replaceBranchAccess(
      ORGANIZATION_ID,
      membershipId,
      overrides.branchIds ?? [BRANCH_ID],
    );
  }

  function authenticate(
    ctx: Awaited<ReturnType<typeof setup>>,
    code: string,
    pin: string,
  ) {
    return ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      code,
      pin,
    });
  }

  it('entra com código e PIN corretos', async () => {
    const ctx = await setup();
    await seedCashier(ctx, { code: '01', name: 'Maria Souza' });

    const session = await authenticate(ctx, '01', PIN);

    expect(session.id).toBe(USER_ID);
    expect(session.membershipId).toBe(MEMBERSHIP_ID);
    expect(session.name).toBe('Maria Souza');
    expect(session.permissionIds).toContain('pdv.operacao.venda.create');
  });

  it('PIN errado e código inexistente devolvem o mesmo erro', async () => {
    const ctx = await setup();
    await seedCashier(ctx, { code: '01' });

    const wrongPin = await authenticate(ctx, '01', '9999').catch(
      (e: unknown) => e,
    );
    const missingCode = await authenticate(ctx, '77', PIN).catch(
      (e: unknown) => e,
    );

    expect(wrongPin).toBeInstanceOf(PosOperatorCredentialsUnauthorizedError);
    expect(missingCode).toBeInstanceOf(PosOperatorCredentialsUnauthorizedError);
    expect((wrongPin as Error).message).toBe((missingCode as Error).message);
  });

  it('conta as tentativas erradas e bloqueia no limite', async () => {
    const ctx = await setup();
    await seedCashier(ctx, { code: '01' });

    for (let i = 0; i < 2; i += 1) {
      await expect(authenticate(ctx, '01', '0000')).rejects.toBeInstanceOf(
        PosOperatorCredentialsUnauthorizedError,
      );
    }
    const afterTwo = await ctx.membershipRepository.findById(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
    );
    expect(afterTwo?.membership.pdvFailedAttempts).toBe(2);
    expect(afterTwo?.membership.isPdvLocked()).toBe(false);

    await expect(authenticate(ctx, '01', '0000')).rejects.toBeInstanceOf(
      PosOperatorLockedError,
    );
    const locked = await ctx.membershipRepository.findById(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
    );
    expect(locked?.membership.isPdvLocked()).toBe(true);
  });

  it('bloqueado recusa até o PIN certo', async () => {
    const ctx = await setup();
    await seedCashier(ctx, { code: '01' });
    for (let i = 0; i < MEMBERSHIP_PDV_MAX_ATTEMPTS; i += 1) {
      await authenticate(ctx, '01', '0000').catch(() => undefined);
    }

    await expect(authenticate(ctx, '01', PIN)).rejects.toBeInstanceOf(
      PosOperatorLockedError,
    );
  });

  it('o bloqueio cresce a cada erro, até o teto', () => {
    let membership = makeMembership({
      pdvCode: '01',
      pdvPinHash: 'hash',
    });

    const durations: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      const before = membership.pdvLockedUntil?.getTime() ?? 0;
      membership = membership.registerPdvFailedAttempt();
      const after = membership.pdvLockedUntil?.getTime() ?? 0;
      if (after > before) durations.push(after - Date.now());
    }

    expect(durations[1]).toBeGreaterThan(durations[0]);
    expect(Math.max(...durations)).toBeLessThanOrEqual(15 * 60_000 + 1000);
  });

  it('acertar o PIN zera o contador', async () => {
    const ctx = await setup();
    await seedCashier(ctx, { code: '01' });
    await authenticate(ctx, '01', '0000').catch(() => undefined);

    const session = await authenticate(ctx, '01', PIN);
    const saved = await ctx.membershipRepository.findById(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
    );

    expect(session.lockedUntil).toBeNull();
    expect(saved?.membership.pdvFailedAttempts).toBe(0);
  });

  it('redefinir o PIN destrava', async () => {
    const ctx = await setup();
    await seedCashier(ctx, { code: '01' });
    for (let i = 0; i < MEMBERSHIP_PDV_MAX_ATTEMPTS; i += 1) {
      await authenticate(ctx, '01', '0000').catch(() => undefined);
    }

    await ctx.setPin.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      pin: '5678',
    });

    const session = await authenticate(ctx, '01', '5678');
    expect(session.id).toBe(USER_ID);
  });

  it('membro inativo não entra e não é contado', async () => {
    const ctx = await setup();
    await seedCashier(ctx, { code: '01', active: false });

    await expect(authenticate(ctx, '01', PIN)).rejects.toBeInstanceOf(
      PosOperatorCredentialsUnauthorizedError,
    );
    const saved = await ctx.membershipRepository.findById(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
    );
    expect(saved?.membership.pdvFailedAttempts).toBe(0);
  });

  it('membro sem acesso à unidade do terminal não entra', async () => {
    const ctx = await setup();
    await seedCashier(ctx, {
      membershipId: OTHER_MEMBERSHIP_ID,
      userId: OTHER_USER_ID,
      code: '01',
      branchIds: [OTHER_BRANCH_ID],
    });

    await expect(authenticate(ctx, '01', PIN)).rejects.toBeInstanceOf(
      PosOperatorCredentialsUnauthorizedError,
    );
  });

  it('a lista do terminal traz só os ativos elegíveis da unidade', async () => {
    const ctx = await setup();
    await seedCashier(ctx, { code: '01' });
    await ctx.userRepository.save(
      makeUser({
        id: OTHER_USER_ID,
        email: 'inativo@lojailheus.com.br',
        keycloakSub: 'kc-inactive',
      }),
    );
    await ctx.membershipRepository.save(
      makeMembership({
        id: OTHER_MEMBERSHIP_ID,
        userId: OTHER_USER_ID,
        permissionProfileId: PROFILE_ID,
        active: false,
        pdvCode: '02',
        pdvPinHash: await PinHasher.hash(PIN),
      }),
    );
    await ctx.membershipRepository.replaceBranchAccess(
      ORGANIZATION_ID,
      OTHER_MEMBERSHIP_ID,
      [BRANCH_ID],
    );

    const list = await ctx.listForTerminal.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
    });

    expect(list.map((o) => o.code)).toEqual(['01']);
  });
});
