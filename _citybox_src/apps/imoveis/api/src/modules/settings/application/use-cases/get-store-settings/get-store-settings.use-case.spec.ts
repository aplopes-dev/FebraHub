import {
  cloneIntegrationSettings,
  DEFAULT_INTEGRATION_SETTINGS,
} from '../../../domain/entities/store-settings.entity';
import { InMemoryStoreSettingsRepository } from '../../../infrastructure/database/in-memory-store-settings.repository';
import { GetStoreSettingsUseCase } from './get-store-settings.use-case';

const STORE = 'store-1';

describe('GetStoreSettingsUseCase', () => {
  let repo: InMemoryStoreSettingsRepository;
  let useCase: GetStoreSettingsUseCase;

  beforeEach(() => {
    repo = new InMemoryStoreSettingsRepository();
    useCase = new GetStoreSettingsUseCase(repo);
  });

  it('cria e persiste a linha com os padrões na primeira leitura', async () => {
    const settings = await useCase.execute({ storeId: STORE });

    expect(settings.system).toEqual({
      companyName: '',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      language: 'pt-BR',
      autoAssignLeads: false,
      requireTwoFactorForNewUsers: true,
      whatsappCatalogEnabled: true,
      leadFormCatalogEnabled: true,
      accentColorId: 'orange',
    });
    expect(settings.notifications).toEqual({
      emailEnabled: true,
      pushEnabled: true,
      leadsAlerts: true,
      calendarAlerts: true,
      documentsAlerts: false,
    });
    expect(settings.integrations).toEqual(DEFAULT_INTEGRATION_SETTINGS);
    await expect(repo.findByStoreId(STORE)).resolves.not.toBeNull();
  });

  it('devolve a configuração salva quando ela já existe', async () => {
    const saved = await repo.upsert(STORE, {
      system: {
        companyName: 'Imobiliária Ilhéus',
        timezone: 'America/Bahia',
        currency: 'BRL',
        language: 'pt-BR',
        autoAssignLeads: true,
        requireTwoFactorForNewUsers: false,
        whatsappCatalogEnabled: true,
        leadFormCatalogEnabled: true,
        accentColorId: 'teal',
      },
      notifications: {
        emailEnabled: false,
        pushEnabled: true,
        leadsAlerts: false,
        calendarAlerts: true,
        documentsAlerts: true,
      },
      integrations: {
        ...cloneIntegrationSettings(DEFAULT_INTEGRATION_SETTINGS),
        olx: { enabled: true, connected: true, accountLabel: 'Loja OLX' },
      },
    });

    const settings = await useCase.execute({ storeId: STORE });

    expect(settings.id).toBe(saved.id);
    expect(settings.system.companyName).toBe('Imobiliária Ilhéus');
    expect(settings.system.accentColorId).toBe('teal');
    expect(settings.notifications.documentsAlerts).toBe(true);
    expect(settings.integrations.olx.accountLabel).toBe('Loja OLX');
  });

  it('isola configurações por loja', async () => {
    await useCase.execute({ storeId: STORE });
    await repo.upsert('store-2', {
      system: {
        companyName: 'Outra',
        timezone: 'America/Bahia',
        currency: 'BRL',
        language: 'pt-BR',
        autoAssignLeads: true,
        requireTwoFactorForNewUsers: true,
        whatsappCatalogEnabled: false,
        leadFormCatalogEnabled: false,
        accentColorId: 'rose',
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        leadsAlerts: true,
        calendarAlerts: true,
        documentsAlerts: false,
      },
      integrations: cloneIntegrationSettings(DEFAULT_INTEGRATION_SETTINGS),
    });

    const settings = await useCase.execute({ storeId: STORE });
    expect(settings.system.companyName).toBe('');
  });
});
