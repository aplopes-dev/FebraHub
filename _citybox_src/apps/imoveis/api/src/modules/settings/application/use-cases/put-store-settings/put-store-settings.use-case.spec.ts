import { DEFAULT_INTEGRATION_SETTINGS } from '../../../domain/entities/store-settings.entity';
import { InvalidAccentColorError } from '../../../domain/errors/invalid-accent-color.error';
import { InMemoryStoreSettingsRepository } from '../../../infrastructure/database/in-memory-store-settings.repository';
import {
  PutStoreSettingsUseCase,
  type PutStoreSettingsInput,
} from './put-store-settings.use-case';

const STORE = 'store-1';

function input(
  overrides: Partial<PutStoreSettingsInput['system']> = {},
): PutStoreSettingsInput {
  return {
    storeId: STORE,
    system: {
      companyName: 'Imobiliária Ilhéus',
      timezone: 'America/Bahia',
      currency: 'BRL',
      language: 'pt-BR',
      autoAssignLeads: true,
      requireTwoFactorForNewUsers: false,
      whatsappCatalogEnabled: true,
      leadFormCatalogEnabled: true,
      accentColorId: 'violet',
      ...overrides,
    },
    notifications: {
      emailEnabled: false,
      pushEnabled: true,
      leadsAlerts: true,
      calendarAlerts: false,
      documentsAlerts: true,
    },
  };
}

describe('PutStoreSettingsUseCase', () => {
  let repo: InMemoryStoreSettingsRepository;
  let useCase: PutStoreSettingsUseCase;

  beforeEach(() => {
    repo = new InMemoryStoreSettingsRepository();
    useCase = new PutStoreSettingsUseCase(repo);
  });

  it('cria a configuração da loja com todos os campos', async () => {
    const settings = await useCase.execute(input());

    expect(settings.system.companyName).toBe('Imobiliária Ilhéus');
    expect(settings.system.autoAssignLeads).toBe(true);
    expect(settings.system.accentColorId).toBe('violet');
    expect(settings.system.whatsappCatalogEnabled).toBe(true);
    expect(settings.system.leadFormCatalogEnabled).toBe(true);
    expect(settings.notifications).toEqual({
      emailEnabled: false,
      pushEnabled: true,
      leadsAlerts: true,
      calendarAlerts: false,
      documentsAlerts: true,
    });
    await expect(repo.findByStoreId(STORE)).resolves.not.toBeNull();
  });

  it('atualiza a linha existente mantendo a identidade', async () => {
    const created = await useCase.execute(input());
    const updated = await useCase.execute(
      input({ companyName: 'Nova Marca', accentColorId: 'green' }),
    );

    expect(updated.id).toBe(created.id);
    expect(updated.system.companyName).toBe('Nova Marca');
    expect(updated.system.accentColorId).toBe('green');
  });

  it('normaliza campos em branco para o padrão', async () => {
    const settings = await useCase.execute(
      input({ companyName: '  Acme  ', timezone: '   ', currency: '' }),
    );

    expect(settings.system.companyName).toBe('Acme');
    expect(settings.system.timezone).toBe('America/Sao_Paulo');
    expect(settings.system.currency).toBe('BRL');
  });

  it('grava whatsappCatalogEnabled desligado', async () => {
    const settings = await useCase.execute(
      input({ whatsappCatalogEnabled: false }),
    );
    expect(settings.system.whatsappCatalogEnabled).toBe(false);
  });

  it('grava leadFormCatalogEnabled desligado', async () => {
    const settings = await useCase.execute(
      input({ leadFormCatalogEnabled: false }),
    );
    expect(settings.system.leadFormCatalogEnabled).toBe(false);
  });

  it('rejeita cor de destaque fora do catálogo', async () => {
    await expect(
      useCase.execute(input({ accentColorId: 'fuchsia' })),
    ).rejects.toBeInstanceOf(InvalidAccentColorError);
    await expect(repo.findByStoreId(STORE)).resolves.toBeNull();
  });

  it('aceita cor customizada em hex', async () => {
    const settings = await useCase.execute(input({ accentColorId: '#a1b2c3' }));

    expect(settings.system.accentColorId).toBe('#A1B2C3');
  });

  it('grava as integrações recebidas', async () => {
    const settings = await useCase.execute({
      ...input(),
      integrations: {
        olx: { enabled: true, connected: true, accountLabel: 'Loja OLX' },
      },
    });

    expect(settings.integrations.olx).toEqual({
      enabled: true,
      connected: true,
      accountLabel: 'Loja OLX',
    });
    expect(settings.integrations.asaas).toEqual(
      DEFAULT_INTEGRATION_SETTINGS.asaas,
    );
  });

  it('mantém as integrações salvas quando o payload as omite', async () => {
    await useCase.execute({
      ...input(),
      integrations: { asaas: { enabled: true, connected: true } },
    });

    const settings = await useCase.execute(input({ companyName: 'Acme' }));

    expect(settings.integrations.asaas.enabled).toBe(true);
  });

  it('usa os padrões de integração na primeira gravação', async () => {
    const settings = await useCase.execute(input());

    expect(settings.integrations).toEqual(DEFAULT_INTEGRATION_SETTINGS);
  });
});
