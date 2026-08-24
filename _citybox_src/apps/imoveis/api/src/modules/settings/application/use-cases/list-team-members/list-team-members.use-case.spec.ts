import { permissionsForRole } from '../../../domain/entities/team-member.entity';
import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { ListTeamMembersUseCase } from './list-team-members.use-case';

const STORE = 'store-1';

describe('ListTeamMembersUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let useCase: ListTeamMembersUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    useCase = new ListTeamMembersUseCase(members);
  });

  it('semeia a equipe padrão na primeira leitura', async () => {
    const result = await useCase.execute({ storeId: STORE });

    expect(result.map((member) => member.agentId).sort()).toEqual([
      'ana-helena',
      'bruno-costa',
      'carla-mendes',
    ]);
    expect(result.find((m) => m.agentId === 'ana-helena')?.role).toBe('admin');
    expect(
      result.find((m) => m.agentId === 'ana-helena')?.permissions.billing,
    ).toBe(true);
  });

  it('não semeia de novo quando já existe alguém', async () => {
    await members.create(STORE, {
      agentId: 'diego-alves',
      name: 'Diego Alves',
      email: 'diego@imob.com',
      phone: '',
      role: 'broker',
      initials: 'DA',
      active: true,
      permissions: permissionsForRole('broker'),
      lastAccessAt: null,
      passwordHash: null,
      temporaryPassword: null,
      mustChangePassword: false,
    });

    const result = await useCase.execute({ storeId: STORE });

    expect(result).toHaveLength(1);
    expect(result[0].agentId).toBe('diego-alves');
  });

  it('semeia por loja de forma isolada', async () => {
    await useCase.execute({ storeId: STORE });

    expect(await members.findAll('store-2')).toHaveLength(0);
    expect(await useCase.execute({ storeId: 'store-2' })).toHaveLength(3);
  });
});
