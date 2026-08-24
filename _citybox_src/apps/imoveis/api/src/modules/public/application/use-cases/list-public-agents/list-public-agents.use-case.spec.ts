import { permissionsForRole } from '../../../../settings/domain/entities/team-member.entity';
import { InMemoryTeamMemberRepository } from '../../../../settings/infrastructure/database/in-memory-team-member.repository';
import { ListPublicAgentsUseCase } from './list-public-agents.use-case';

const STORE = 'dev-store-imoveis';

describe('ListPublicAgentsUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let useCase: ListPublicAgentsUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    useCase = new ListPublicAgentsUseCase(members);
  });

  it('lista apenas corretores ativos', async () => {
    await members.create(STORE, {
      agentId: 'ana-helena',
      name: 'Ana Helena',
      email: 'ana@imob.com',
      phone: '',
      role: 'broker',
      initials: 'AH',
      active: true,
      permissions: permissionsForRole('broker'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: new Date('2026-08-01T12:00:00.000Z'),
    });
    await members.create(STORE, {
      agentId: 'inativo',
      name: 'Inativo',
      email: 'inativo@imob.com',
      phone: '',
      role: 'broker',
      initials: 'IN',
      active: false,
      permissions: permissionsForRole('broker'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });

    const result = await useCase.execute({ storeId: STORE });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      slug: 'ana-helena',
      name: 'Ana Helena',
      updatedAt: '2026-08-01T12:00:00.000Z',
    });
  });
});
