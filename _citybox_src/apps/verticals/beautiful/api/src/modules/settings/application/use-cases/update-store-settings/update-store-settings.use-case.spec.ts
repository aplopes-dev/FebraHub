import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { InMemoryStoreSettingsRepository } from '../../../tests/in-memory-store-settings.repository';
import { GetStoreSettingsUseCase } from '../get-store-settings/get-store-settings.use-case';
import { UpdateStoreSettingsUseCase } from './update-store-settings.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('UpdateStoreSettingsUseCase — themeId', () => {
  let repository: InMemoryStoreSettingsRepository;
  let updateUseCase: UpdateStoreSettingsUseCase;
  let getUseCase: GetStoreSettingsUseCase;

  beforeEach(() => {
    repository = new InMemoryStoreSettingsRepository();
    updateUseCase = new UpdateStoreSettingsUseCase(repository);
    getUseCase = new GetStoreSettingsUseCase(repository);
  });

  it('cria o estabelecimento com o tema padrão purple', async () => {
    const settings = await getUseCase.execute({ storeId: STORE_ID });
    expect(settings.themeId).toBe('purple');
  });

  it('persiste um tema válido sem alterar os demais campos', async () => {
    await updateUseCase.execute({ storeId: STORE_ID, name: 'Studio Bella' });
    const updated = await updateUseCase.execute({
      storeId: STORE_ID,
      themeId: 'emerald',
    });

    expect(updated.themeId).toBe('emerald');
    expect(updated.name).toBe('Studio Bella');

    const stored = await getUseCase.execute({ storeId: STORE_ID });
    expect(stored.themeId).toBe('emerald');
    expect(stored.name).toBe('Studio Bella');
  });

  it('isola o tema por loja', async () => {
    await updateUseCase.execute({ storeId: STORE_ID, themeId: 'rose' });
    await updateUseCase.execute({ storeId: OTHER_STORE_ID, themeId: 'barber' });

    const storeA = await getUseCase.execute({ storeId: STORE_ID });
    const storeB = await getUseCase.execute({ storeId: OTHER_STORE_ID });
    expect(storeA.themeId).toBe('rose');
    expect(storeB.themeId).toBe('barber');
  });

  it('rejeita um themeId fora do catálogo', async () => {
    await expect(
      updateUseCase.execute({ storeId: STORE_ID, themeId: 'neon' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
