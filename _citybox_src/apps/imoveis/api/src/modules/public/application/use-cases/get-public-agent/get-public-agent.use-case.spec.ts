import { permissionsForRole } from '../../../../settings/domain/entities/team-member.entity';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';
import { InMemoryStoreSettingsRepository } from '../../../../settings/infrastructure/database/in-memory-store-settings.repository';
import { InMemoryTeamMemberRepository } from '../../../../settings/infrastructure/database/in-memory-team-member.repository';
import { PublicAgentNotFoundError } from '../../../domain/errors/public-agent-not-found.error';
import { GetPublicAgentUseCase } from './get-public-agent.use-case';

const STORE = 'dev-store-imoveis';

describe('GetPublicAgentUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let profiles: InMemoryAgentProfileRepository;
  let settings: InMemoryStoreSettingsRepository;
  let useCase: GetPublicAgentUseCase;

  beforeEach(() => {
    members = new InMemoryTeamMemberRepository();
    profiles = new InMemoryAgentProfileRepository();
    settings = new InMemoryStoreSettingsRepository();
    useCase = new GetPublicAgentUseCase(members, profiles, settings);
  });

  it('retorna perfil público mergeado sem taxId', async () => {
    await members.create(STORE, {
      agentId: 'ana-helena',
      name: 'Ana Helena Ribeiro',
      email: 'ana@imob.com',
      phone: '(73) 99999-0000',
      role: 'broker',
      initials: 'AH',
      active: true,
      permissions: permissionsForRole('broker'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });
    await profiles.upsert(STORE, 'ana-helena', {
      name: 'Ana Helena',
      role: 'Corretora',
      region: 'Ilhéus, BA',
      stateId: 'CRECI/BA 12345',
      taxId: '000.000.000-00',
    });

    const result = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
    });

    expect(result.slug).toBe('ana-helena');
    expect(result.name).toBe('Ana Helena');
    expect(result.headline).toBe('Corretora');
    expect(result.region).toBe('Ilhéus, BA');
    expect(result.creci).toBe('CRECI/BA 12345');
    expect(result.whatsappCatalogEnabled).toBe(true);
    expect(result.leadFormCatalogEnabled).toBe(true);
    expect(result).not.toHaveProperty('taxId');
  });

  it('respeita whatsappCatalogEnabled desligado na loja', async () => {
    await members.create(STORE, {
      agentId: 'ana-helena',
      name: 'Ana',
      email: 'ana@imob.com',
      phone: '73999990000',
      role: 'broker',
      initials: 'AH',
      active: true,
      permissions: permissionsForRole('broker'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });
    await settings.upsert(STORE, {
      system: {
        companyName: 'Loja',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        autoAssignLeads: false,
        requireTwoFactorForNewUsers: true,
        whatsappCatalogEnabled: false,
        leadFormCatalogEnabled: true,
        accentColorId: 'blue',
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        leadsAlerts: true,
        calendarAlerts: true,
        documentsAlerts: false,
      },
      integrations: {
        whatsapp: { enabled: true, connected: true },
        olx: { enabled: false, connected: false },
        zap: { enabled: false, connected: false },
        'google-calendar': { enabled: false, connected: false },
        'meta-ads': { enabled: false, connected: false },
        asaas: { enabled: false, connected: false },
      },
    });

    const result = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
    });

    expect(result.whatsappCatalogEnabled).toBe(false);
    expect(result.leadFormCatalogEnabled).toBe(true);
    expect(result.accentColorId).toBe('blue');
  });

  it('respeita leadFormCatalogEnabled desligado na loja', async () => {
    await members.create(STORE, {
      agentId: 'ana-helena',
      name: 'Ana',
      email: 'ana@imob.com',
      phone: '73999990000',
      role: 'broker',
      initials: 'AH',
      active: true,
      permissions: permissionsForRole('broker'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });
    await settings.upsert(STORE, {
      system: {
        companyName: 'Loja',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        autoAssignLeads: false,
        requireTwoFactorForNewUsers: true,
        whatsappCatalogEnabled: true,
        leadFormCatalogEnabled: false,
        accentColorId: 'orange',
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        leadsAlerts: true,
        calendarAlerts: true,
        documentsAlerts: false,
      },
      integrations: {
        whatsapp: { enabled: true, connected: true },
        olx: { enabled: false, connected: false },
        zap: { enabled: false, connected: false },
        'google-calendar': { enabled: false, connected: false },
        'meta-ads': { enabled: false, connected: false },
        asaas: { enabled: false, connected: false },
      },
    });

    const result = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
    });

    expect(result.leadFormCatalogEnabled).toBe(false);
  });

  it('usa dados do team member quando perfil não existe', async () => {
    await members.create(STORE, {
      agentId: 'bruno-costa',
      name: 'Bruno Costa',
      email: 'bruno@imob.com',
      phone: '',
      role: 'broker',
      initials: 'BC',
      active: true,
      permissions: permissionsForRole('broker'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });

    const result = await useCase.execute({
      storeId: STORE,
      slug: 'bruno-costa',
    });

    expect(result.name).toBe('Bruno Costa');
    expect(result.headline).toBe('');
    expect(result.hasPhoto).toBe(false);
    expect(result.accentColorId).toBe('orange');
  });

  it('rejeita slug inexistente', async () => {
    await expect(
      useCase.execute({ storeId: STORE, slug: 'inexistente' }),
    ).rejects.toBeInstanceOf(PublicAgentNotFoundError);
  });

  it('rejeita corretor inativo', async () => {
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

    await expect(
      useCase.execute({ storeId: STORE, slug: 'inativo' }),
    ).rejects.toBeInstanceOf(PublicAgentNotFoundError);
  });
});
