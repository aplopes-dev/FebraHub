import { CreateProductCategoryUseCase } from './create-product-category.use-case';
import { ProductCategoryNameTakenError } from '../../../domain/errors/product-category-name-taken.error';
import {
  makeCategory,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('CreateProductCategoryUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new CreateProductCategoryUseCase(repos.categoryRepository);
    return { ...repos, useCase };
  }

  it('cria uma categoria com nome e status ativo', async () => {
    const { useCase } = setup();

    const category = await useCase.execute({
      organizationId: STORE_ID,
      name: ' Bebidas ',
      active: true,
    });

    expect(category.name).toBe('Bebidas');
    expect(category.active).toBe(true);
    expect(category.organizationId).toBe(STORE_ID);
  });

  it('rejeita nome duplicado na mesma loja', async () => {
    const { useCase, categoryRepository } = setup();
    await categoryRepository.save(makeCategory({ name: 'Vestuário' }));

    await expect(
      useCase.execute({ organizationId: STORE_ID, name: 'vestuário' }),
    ).rejects.toBeInstanceOf(ProductCategoryNameTakenError);
  });
});
