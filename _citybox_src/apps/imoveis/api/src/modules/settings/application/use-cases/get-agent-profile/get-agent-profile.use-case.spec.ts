import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { InMemoryTeamMemberRepository } from '../../../infrastructure/database/in-memory-team-member.repository';
import { createPermissions } from '../../../domain/entities/team-member.entity';
import { GetAgentProfileUseCase } from './get-agent-profile.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

describe('GetAgentProfileUseCase', () => {
  let profiles: InMemoryAgentProfileRepository;
  let members: InMemoryTeamMemberRepository;
  let useCase: GetAgentProfileUseCase;

  beforeEach(() => {
    profiles = new InMemoryAgentProfileRepository();
    members = new InMemoryTeamMemberRepository();
    useCase = new GetAgentProfileUseCase(profiles, members);
  });

  it('cria perfil vazio na primeira leitura sem TeamMember', async () => {
    const profile = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(profile.agentId).toBe(AGENT);
    expect(profile.name).toBe('');
    expect(profile.photo).toBeNull();
    expect(profile.legalDocuments).toEqual([]);
    await expect(profiles.findByAgentId(STORE, AGENT)).resolves.not.toBeNull();
  });

  it('preenche nome/e-mail a partir do TeamMember na primeira leitura', async () => {
    await members.create(STORE, {
      agentId: AGENT,
      name: 'Ana Helena',
      email: 'ana@imob.com',
      phone: '73999990000',
      role: 'broker',
      initials: 'AH',
      active: true,
      permissions: createPermissions(),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });

    const profile = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(profile.name).toBe('Ana Helena');
    expect(profile.email).toBe('ana@imob.com');
    expect(profile.phone).toBe('73999990000');
    expect(profile.role).toBe('Administrador/Corretor');
  });

  it('devolve o perfil salvo quando ele já existe com dados', async () => {
    const saved = await profiles.upsert(STORE, AGENT, {
      name: 'Ana Helena',
      role: 'Corretora',
      email: 'ana@imob.com',
      phone: '73999990000',
      region: 'Ilhéus',
      stateId: 'CRECI-12345',
      taxId: '000.000.000-00',
    });

    const profile = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(profile.id).toBe(saved.id);
    expect(profile.name).toBe('Ana Helena');
    expect(profile.stateId).toBe('CRECI-12345');
  });

  it('corrige cargo padrão errado a partir do TeamMember sem apagar título livre', async () => {
    await members.create(STORE, {
      agentId: AGENT,
      name: 'Admin Plataforma',
      email: 'admin@citybox.com',
      phone: '',
      role: 'admin',
      initials: 'AP',
      active: true,
      permissions: createPermissions(),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });

    await profiles.upsert(STORE, AGENT, {
      name: 'Admin Plataforma',
      role: 'Administrador/Corretor',
      email: 'admin@citybox.com',
      phone: '',
      region: '',
      stateId: '',
      taxId: '',
    });

    const fixed = await useCase.execute({ storeId: STORE, agentId: AGENT });
    expect(fixed.role).toBe('Administrador');
    expect(fixed.name).toBe('Admin Plataforma');

    await profiles.upsert(STORE, AGENT, {
      name: 'Admin Plataforma',
      role: 'Sócio-diretor',
      email: 'admin@citybox.com',
      phone: '',
      region: '',
      stateId: '',
      taxId: '',
    });

    const custom = await useCase.execute({ storeId: STORE, agentId: AGENT });
    expect(custom.role).toBe('Sócio-diretor');
  });

  it('isola perfis por loja e por corretor', async () => {
    await useCase.execute({ storeId: STORE, agentId: AGENT });
    await profiles.upsert('store-2', AGENT, {
      name: 'Outra Ana',
      role: '',
      email: '',
      phone: '',
      region: '',
      stateId: '',
      taxId: '',
    });

    const profile = await useCase.execute({ storeId: STORE, agentId: AGENT });
    expect(profile.name).toBe('');
  });
});
