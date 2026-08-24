import { permissionsForRole } from '../../../domain/entities/team-member.entity';
import { InvalidTeamMemberRoleError } from '../../../domain/errors/invalid-team-member-role.error';
import { LastAdminForbiddenError } from '../../../domain/errors/last-admin-forbidden.error';
import { TeamMemberAlreadyExistsError } from '../../../domain/errors/team-member-already-exists.error';
import { TeamMemberNotFoundError } from '../../../domain/errors/team-member-not-found.error';
import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { FakeIdentityProvider } from '../../../../tenancy/tests/fake-identity.provider';
import { UpdateTeamMemberUseCase } from './update-team-member.use-case';

const STORE = 'store-1';

describe('UpdateTeamMemberUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let useCase: UpdateTeamMemberUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    useCase = new UpdateTeamMemberUseCase(members, new FakeIdentityProvider());
  });

  async function createMember(
    agentId: string,
    role: 'admin' | 'broker' | 'assistant',
    overrides: { email?: string; active?: boolean } = {},
  ) {
    return members.create(STORE, {
      agentId,
      name: agentId,
      email: overrides.email ?? `${agentId}@imob.com`,
      phone: '',
      role,
      initials: 'XX',
      active: overrides.active ?? true,
      permissions: permissionsForRole(role),
      lastAccessAt: null,
      passwordHash: null,
      temporaryPassword: null,
      mustChangePassword: false,
    });
  }

  it('atualiza nome, telefone e recalcula as iniciais', async () => {
    await createMember('bruno-costa', 'broker');

    const updated = await useCase.execute({
      storeId: STORE,
      agentId: 'bruno-costa',
      name: 'Bruno Costa',
      phone: '(41) 99102-8831',
    });

    expect(updated.name).toBe('Bruno Costa');
    expect(updated.initials).toBe('BC');
    expect(updated.phone).toBe('(41) 99102-8831');
  });

  it('aplica as permissões do novo papel', async () => {
    await createMember('bruno-costa', 'broker');

    const updated = await useCase.execute({
      storeId: STORE,
      agentId: 'bruno-costa',
      role: 'admin',
    });

    expect(updated.role).toBe('admin');
    expect(updated.permissions.users).toBe(true);
  });

  it('aceita permissões customizadas', async () => {
    await createMember('bruno-costa', 'broker');

    const updated = await useCase.execute({
      storeId: STORE,
      agentId: 'bruno-costa',
      permissions: { billing: true },
    });

    expect(updated.permissions.billing).toBe(true);
  });

  it('rejeita rebaixar o último administrador', async () => {
    await createMember('ana-helena', 'admin');

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: 'ana-helena',
        role: 'broker',
      }),
    ).rejects.toBeInstanceOf(LastAdminForbiddenError);
  });

  it('rejeita desativar o último administrador', async () => {
    await createMember('ana-helena', 'admin');

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: 'ana-helena',
        active: false,
      }),
    ).rejects.toBeInstanceOf(LastAdminForbiddenError);
  });

  it('permite rebaixar quando existe outro administrador ativo', async () => {
    await createMember('ana-helena', 'admin');
    await createMember('diego-alves', 'admin');

    const updated = await useCase.execute({
      storeId: STORE,
      agentId: 'diego-alves',
      role: 'broker',
    });

    expect(updated.role).toBe('broker');
  });

  it('rejeita e-mail de outro usuário da loja', async () => {
    await createMember('ana-helena', 'admin');
    await createMember('bruno-costa', 'broker');

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: 'bruno-costa',
        email: 'ana-helena@imob.com',
      }),
    ).rejects.toBeInstanceOf(TeamMemberAlreadyExistsError);
  });

  it('rejeita papel desconhecido', async () => {
    await createMember('bruno-costa', 'broker');

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: 'bruno-costa',
        role: 'manager',
      }),
    ).rejects.toBeInstanceOf(InvalidTeamMemberRoleError);
  });

  it('rejeita usuário inexistente', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: 'fantasma',
        name: 'X',
      }),
    ).rejects.toBeInstanceOf(TeamMemberNotFoundError);
  });
});
