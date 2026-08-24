import { UpdateProductAddonUseCase } from './update-product-addon.use-case';
import { ProductAddonNotFoundError } from '../../../domain/errors/product-addon-not-found.error';
import { ProductAddonNameTakenError } from '../../../domain/errors/product-addon-name-taken.error';
import {
  ADDON_ID,
  OTHER_ADDON_ID,
  makeAddon,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('UpdateProductAddonUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new UpdateProductAddonUseCase(repos.addonRepository);
    return { ...repos, useCase };
  }

  it('atualiza nome e preço padrão do adicional', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(makeAddon());

    const updated = await useCase.execute({
      organizationId: STORE_ID,
      id: ADDON_ID,
      name: 'Bacon extra',
      defaultPriceCents: 500,
    });

    expect(updated.name).toBe('Bacon extra');
    expect(updated.defaultPriceCents).toBe(500);
  });

  it('lança 404 quando o adicional não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        id: ADDON_ID,
        name: 'Bacon',
        defaultPriceCents: 350,
      }),
    ).rejects.toBeInstanceOf(ProductAddonNotFoundError);
  });

  it('rejeita renomear para um nome já usado por outro adicional ativo', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(makeAddon({ id: ADDON_ID, name: 'Bacon' }));
    await addonRepository.save(
      makeAddon({ id: OTHER_ADDON_ID, name: 'Queijo cheddar' }),
    );

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        id: ADDON_ID,
        name: 'queijo cheddar',
        defaultPriceCents: 350,
      }),
    ).rejects.toBeInstanceOf(ProductAddonNameTakenError);
  });

  it('permite manter o próprio nome sem disparar conflito', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(makeAddon({ id: ADDON_ID, name: 'Bacon' }));

    const updated = await useCase.execute({
      organizationId: STORE_ID,
      id: ADDON_ID,
      name: 'Bacon',
      defaultPriceCents: 400,
    });

    expect(updated.defaultPriceCents).toBe(400);
  });
});
