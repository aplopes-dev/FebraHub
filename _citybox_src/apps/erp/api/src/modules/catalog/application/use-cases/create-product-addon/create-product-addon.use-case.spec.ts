import { CreateProductAddonUseCase } from './create-product-addon.use-case';
import { ProductAddonNameTakenError } from '../../../domain/errors/product-addon-name-taken.error';
import {
  makeAddon,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('CreateProductAddonUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new CreateProductAddonUseCase(repos.addonRepository);
    return { ...repos, useCase };
  }

  it('cria um adicional com nome e preço padrão', async () => {
    const { useCase } = setup();

    const addon = await useCase.execute({
      organizationId: STORE_ID,
      name: ' Bacon ',
      defaultPriceCents: 350,
    });

    expect(addon.name).toBe('Bacon');
    expect(addon.defaultPriceCents).toBe(350);
    expect(addon.organizationId).toBe(STORE_ID);
  });

  it('rejeita nome duplicado na mesma organização (case-insensitive)', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(makeAddon({ name: 'Queijo cheddar' }));

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        name: 'queijo cheddar',
        defaultPriceCents: 200,
      }),
    ).rejects.toBeInstanceOf(ProductAddonNameTakenError);
  });

  it('permite reusar o nome de um adicional já excluído', async () => {
    const { useCase, addonRepository } = setup();
    await addonRepository.save(
      makeAddon({ name: 'Bacon', deletedAt: new Date() }),
    );

    const addon = await useCase.execute({
      organizationId: STORE_ID,
      name: 'Bacon',
      defaultPriceCents: 400,
    });

    expect(addon.name).toBe('Bacon');
  });
});
