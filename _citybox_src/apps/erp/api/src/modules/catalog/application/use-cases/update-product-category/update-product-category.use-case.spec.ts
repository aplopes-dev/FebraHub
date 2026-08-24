import { UpdateProductCategoryUseCase } from './update-product-category.use-case';
import { ProductCategoryNotFoundError } from '../../../domain/errors/product-category-not-found.error';
import { ProductCategoryNameTakenError } from '../../../domain/errors/product-category-name-taken.error';
import {
  CATEGORY_ID,
  makeCategory,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('UpdateProductCategoryUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.categoryRepository.save(makeCategory());
    const useCase = new UpdateProductCategoryUseCase(repos.categoryRepository);
    return { ...repos, useCase };
  }

  it('atualiza nome e status da categoria', async () => {
    const { useCase } = await setup();

    const updated = await useCase.execute({
      organizationId: STORE_ID,
      id: CATEGORY_ID,
      name: 'Moda',
      active: false,
    });

    expect(updated.name).toBe('Moda');
    expect(updated.active).toBe(false);
  });

  it('retorna 404 quando a categoria não existe', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        id: 'missing-id',
        name: 'X',
        active: true,
      }),
    ).rejects.toBeInstanceOf(ProductCategoryNotFoundError);
  });

  it('rejeita renomear para um nome já usado', async () => {
    const { useCase, categoryRepository } = await setup();
    await categoryRepository.save(
      makeCategory({ id: 'cat-2', name: 'Alimentos' }),
    );

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        id: CATEGORY_ID,
        name: 'Alimentos',
        active: true,
      }),
    ).rejects.toBeInstanceOf(ProductCategoryNameTakenError);
  });
});
