import { InMemoryStoreSettingsRepository } from '../../../infrastructure/database/in-memory-store-settings.repository';
import { PutStoreNotificationsUseCase } from './put-store-notifications.use-case';

const STORE = 'store-1';

describe('PutStoreNotificationsUseCase', () => {
  let repo: InMemoryStoreSettingsRepository;
  let useCase: PutStoreNotificationsUseCase;

  beforeEach(() => {
    repo = new InMemoryStoreSettingsRepository();
    useCase = new PutStoreNotificationsUseCase(repo);
  });

  it('grava notificações e preserva sistema/integrações existentes', async () => {
    await repo.upsert(STORE, {
      system: {
        companyName: 'Imob Demo',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        autoAssignLeads: true,
        requireTwoFactorForNewUsers: false,
        whatsappCatalogEnabled: true,
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
        whatsapp: { enabled: true, connected: true, accountLabel: 'WA' },
        olx: { enabled: false, connected: false },
        zap: { enabled: false, connected: false },
        'google-calendar': { enabled: false, connected: false },
        'meta-ads': { enabled: false, connected: false },
        asaas: { enabled: false, connected: false },
      },
    });

    const saved = await useCase.execute({
      storeId: STORE,
      notifications: {
        emailEnabled: false,
        pushEnabled: true,
        leadsAlerts: false,
        calendarAlerts: true,
        documentsAlerts: true,
      },
    });

    expect(saved.notifications).toEqual({
      emailEnabled: false,
      pushEnabled: true,
      leadsAlerts: false,
      calendarAlerts: true,
      documentsAlerts: true,
    });
    expect(saved.system.companyName).toBe('Imob Demo');
    expect(saved.system.accentColorId).toBe('blue');
    expect(saved.integrations.whatsapp.accountLabel).toBe('WA');
  });
});
