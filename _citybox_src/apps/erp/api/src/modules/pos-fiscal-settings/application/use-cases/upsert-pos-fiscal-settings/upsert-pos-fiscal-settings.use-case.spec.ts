import { GetPosFiscalSettingsUseCase } from '../get-pos-fiscal-settings/get-pos-fiscal-settings.use-case';
import { UpsertPosFiscalSettingsUseCase } from './upsert-pos-fiscal-settings.use-case';
import { InMemoryPosFiscalSettingsRepository } from '../../../tests/in-memory-pos-fiscal-settings.repository';

const ORG = 'org-1';

describe('PosFiscalSettings use-cases', () => {
  let repo: InMemoryPosFiscalSettingsRepository;
  let get: GetPosFiscalSettingsUseCase;
  let upsert: UpsertPosFiscalSettingsUseCase;

  beforeEach(() => {
    repo = new InMemoryPosFiscalSettingsRepository();
    get = new GetPosFiscalSettingsUseCase(repo);
    upsert = new UpsertPosFiscalSettingsUseCase(repo);
  });

  it('cria a configuração padrão (não configurada) na primeira leitura', async () => {
    const settings = await get.execute({ organizationId: ORG });
    expect(settings.posDocumentModel).toBeNull();
    expect(settings.organizationId).toBe(ORG);
  });

  it('grava o modelo escolhido e quem alterou', async () => {
    const saved = await upsert.execute({
      organizationId: ORG,
      posDocumentModel: 'MODEL_65',
      updatedByUserId: 'user-1',
    });
    expect(saved.posDocumentModel).toBe('MODEL_65');
    expect(saved.updatedByUserId).toBe('user-1');

    // Persistiu: uma leitura seguinte reflete o modelo (não recria default).
    const reloaded = await get.execute({ organizationId: ORG });
    expect(reloaded.posDocumentModel).toBe('MODEL_65');
    expect(reloaded.id).toBe(saved.id);
  });

  it('troca o modelo mantendo a mesma configuração da organização', async () => {
    const first = await upsert.execute({
      organizationId: ORG,
      posDocumentModel: 'MODEL_55',
      updatedByUserId: 'user-1',
    });
    const second = await upsert.execute({
      organizationId: ORG,
      posDocumentModel: 'MODEL_65',
      updatedByUserId: 'user-2',
    });
    expect(second.id).toBe(first.id);
    expect(second.posDocumentModel).toBe('MODEL_65');
    expect(second.updatedByUserId).toBe('user-2');
  });

  it('permite limpar a configuração (voltar a não configurada)', async () => {
    await upsert.execute({
      organizationId: ORG,
      posDocumentModel: 'MODEL_65',
      updatedByUserId: 'user-1',
    });
    const cleared = await upsert.execute({
      organizationId: ORG,
      posDocumentModel: null,
      updatedByUserId: 'user-1',
    });
    expect(cleared.posDocumentModel).toBeNull();
  });
});
