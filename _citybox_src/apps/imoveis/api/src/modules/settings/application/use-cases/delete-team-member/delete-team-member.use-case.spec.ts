import { permissionsForRole } from '../../../domain/entities/team-member.entity';
import { LastAdminForbiddenError } from '../../../domain/errors/last-admin-forbidden.error';
import { TeamMemberNotFoundError } from '../../../domain/errors/team-member-not-found.error';
import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { DeleteTeamMemberUseCase } from './delete-team-member.use-case';

const STORE = 'store-1';

describe('DeleteTeamMemberUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let useCase: DeleteTeamMemberUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    useCase = new DeleteTeamMemberUseCase(members);
  });

  async function createMember(
    agentId: string,
    role: 'admin' | 'broker' | 'assistant',
    extras: { keycloakSub?: string; storeId?: string } = {},
  ) {
    const storeId = extras.storeId ?? STORE;
    return members.create(storeId, {
      agentId,
      name: agentId,
      email: `${agentId}@imob.com`,
      phone: '',
      role,
      initials: 'XX',
      active: true,
      permissions: permissionsForRole(role),
      lastAccessAt: null,
      passwordHash: null,
      temporaryPassword: null,
      mustChangePassword: false,
      keycloakSub: extras.keycloakSub ?? null,
      username: extras.keycloakSub ? agentId : null,
      hasPassword: Boolean(extras.keycloakSub),
    });
  }

  it('remove um usuário comum', async () => {
    await createMember('ana-helena', 'admin');
    await createMember('bruno-costa', 'broker');

    await useCase.execute({ storeId: STORE, agentId: 'bruno-costa' });

    expect(await members.findByAgentId(STORE, 'bruno-costa')).toBeNull();
  });

  it('rejeita remover o último administrador', async () => {
    await createMember('ana-helena', 'admin');
    await createMember('bruno-costa', 'broker');

    await expect(
      useCase.execute({ storeId: STORE, agentId: 'ana-helena' }),
    ).rejects.toBeInstanceOf(LastAdminForbiddenError);
  });

  it('remove um administrador quando existe outro', async () => {
    await createMember('ana-helena', 'admin');
    await createMember('diego-alves', 'admin');

    await useCase.execute({ storeId: STORE, agentId: 'diego-alves' });

    expect(await members.findAll(STORE)).toHaveLength(1);
  });

  it('remove só o vínculo local, sem tocar na identidade', async () => {
    await createMember('ana-helena', 'admin', { keycloakSub: 'sub-admin' });
    await createMember('diego-alves', 'admin', { keycloakSub: 'sub-diego' });

    await useCase.execute({ storeId: STORE, agentId: 'diego-alves' });

    expect(await members.findByAgentId(STORE, 'diego-alves')).toBeNull();
    // O `sub` continua no realm `citybox-imoveis`: pode ser membro de outra loja.
    expect(await members.findByKeycloakSub('sub-admin')).toHaveLength(1);
  });

  it('preserva o vínculo do mesmo sub em outra loja', async () => {
    await createMember('ana-helena', 'admin', { keycloakSub: 'sub-shared' });
    await createMember('outro-admin', 'admin'); // mantém admin na loja de origem
    await createMember('diego-alves', 'admin', {
      keycloakSub: 'sub-shared',
      storeId: 'store-2',
    });

    await useCase.execute({ storeId: STORE, agentId: 'ana-helena' });

    const remaining = await members.findByKeycloakSub('sub-shared');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].storeId).toBe('store-2');
  });

  it('rejeita usuário inexistente', async () => {
    await expect(
      useCase.execute({ storeId: STORE, agentId: 'fantasma' }),
    ).rejects.toBeInstanceOf(TeamMemberNotFoundError);
  });
});
