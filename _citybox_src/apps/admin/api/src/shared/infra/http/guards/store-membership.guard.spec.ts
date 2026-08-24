import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StoreMembershipGuard } from './store-membership.guard';
import type { StoreDetailRepository } from '../../../../modules/stores/domain/repositories/store-detail.repository.interface';
import type { StoreMemberRow } from '../../../../modules/stores/domain/repositories/store-detail.repository.interface';
import type { AuthenticatedUser } from '../auth/authenticated-user';

const MEMBER: StoreMemberRow = {
  id: 'member-1',
  keycloakSub: 'kc-member',
  username: 'maria.silva',
  email: null,
  firstName: 'Maria',
  lastName: 'Silva',
  role: 'caixa',
  permissions: [],
  hasPassword: true,
  disabledAt: null,
  provisionalExpiresAt: null,
};

function createContext(
  user: AuthenticatedUser | undefined,
  params: Record<string, string>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, params }),
    }),
  } as unknown as ExecutionContext;
}

function createGuard(member: StoreMemberRow | null) {
  const repo: Pick<StoreDetailRepository, 'findMemberByStoreAndSub'> = {
    findMemberByStoreAndSub: jest.fn((storeId: string, sub: string) =>
      Promise.resolve(
        storeId === 'store-1' && sub === 'kc-member' ? member : null,
      ),
    ),
  };
  return {
    guard: new StoreMembershipGuard(repo as StoreDetailRepository),
    repo,
  };
}

describe('StoreMembershipGuard', () => {
  it('libera membro da própria loja', async () => {
    const { guard } = createGuard(MEMBER);
    const ctx = createContext(
      { sub: 'kc-member', roles: [] },
      { storeId: 'store-1' },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('libera platform_admin sem consultar o repositório', async () => {
    const { guard, repo } = createGuard(MEMBER);
    const ctx = createContext(
      { sub: 'dev-admin', roles: ['platform_admin'] },
      { storeId: 'store-1' },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(repo.findMemberByStoreAndSub).not.toHaveBeenCalled();
  });

  it('bloqueia usuário que não é membro da loja', async () => {
    const { guard } = createGuard(null);
    const ctx = createContext(
      { sub: 'kc-stranger', roles: [] },
      { storeId: 'store-1' },
    );
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('bloqueia membro de outra loja', async () => {
    const { guard } = createGuard(MEMBER);
    const ctx = createContext(
      { sub: 'kc-member', roles: [] },
      { storeId: 'store-2' },
    );
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('bloqueia requisição sem usuário autenticado', async () => {
    const { guard } = createGuard(MEMBER);
    const ctx = createContext(undefined, { storeId: 'store-1' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('bloqueia quando o storeId não está na rota', async () => {
    const { guard } = createGuard(MEMBER);
    const ctx = createContext({ sub: 'kc-member', roles: [] }, {});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
