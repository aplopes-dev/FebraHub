import { DeleteProductAddonUseCase } from './delete-product-addon.use-case';
import { ProductAddonNotFoundError } from '../../../domain/errors/product-addon-not-found.error';
import {
  ADDON_ID,
  makeAddon,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('DeleteProductAddonUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new DeleteProductAddonUseCase(repos.addonRepository);
    return { ...repos, useCase };
  }

  it('exclui (soft-delete) o adicional', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(makeAddon());

    await useCase.execute({ organizationId: STORE_ID, id: ADDON_ID });

    const found = await addonRepository.findById(STORE_ID, ADDON_ID);
    expect(found?.isDeleted()).toBe(true);
  });

  it('mantém o registro legível após excluído (FR-004)', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(makeAddon());

    await useCase.execute({ organizationId: STORE_ID, id: ADDON_ID });

    const found = await addonRepository.findById(STORE_ID, ADDON_ID);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Bacon');
  });

  it('lança 404 quando o adicional não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: ADDON_ID }),
    ).rejects.toBeInstanceOf(ProductAddonNotFoundError);
  });

  it('lança 404 ao tentar excluir um adicional já excluído', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(makeAddon({ deletedAt: new Date() }));

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: ADDON_ID }),
    ).rejects.toBeInstanceOf(ProductAddonNotFoundError);
  });
});
