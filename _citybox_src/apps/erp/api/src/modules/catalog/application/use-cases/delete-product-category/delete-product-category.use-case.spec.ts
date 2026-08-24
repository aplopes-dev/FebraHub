import { DeleteProductCategoryUseCase } from './delete-product-category.use-case';
import { ProductCategoryNotFoundError } from '../../../domain/errors/product-category-not-found.error';
import { ProductCategoryInUseError } from '../../../domain/errors/product-category-in-use.error';
import { ProductCategoryNotRemovableError } from '../../../domain/errors/product-category-not-removable.error';
import {
  CATEGORY_ID,
  makeCategory,
  makeProduct,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('DeleteProductCategoryUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.categoryRepository.save(makeCategory());
    const useCase = new DeleteProductCategoryUseCase(
      repos.categoryRepository,
      repos.productRepository,
    );
    return { ...repos, useCase };
  }

  it('exclui categoria sem produtos vinculados', async () => {
    const { useCase, categoryRepository } = await setup();

    await useCase.execute({ organizationId: STORE_ID, id: CATEGORY_ID });

    expect(await categoryRepository.findById(STORE_ID, CATEGORY_ID)).toBeNull();
  });

  it('bloqueia exclusão de categoria provisionada pelo sistema', async () => {
    const repos = makeRepositories();
    await repos.categoryRepository.save(
      makeCategory({ systemKey: 'pc-geral', isSystem: true }),
    );
    const useCase = new DeleteProductCategoryUseCase(
      repos.categoryRepository,
      repos.productRepository,
    );

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: CATEGORY_ID }),
    ).rejects.toBeInstanceOf(ProductCategoryNotRemovableError);

    expect(
      await repos.categoryRepository.findById(STORE_ID, CATEGORY_ID),
    ).not.toBeNull();
  });

  it('bloqueia exclusão quando há produtos vinculados', async () => {
    const { useCase, productRepository } = await setup();
    await productRepository.save(makeProduct());

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: CATEGORY_ID }),
    ).rejects.toBeInstanceOf(ProductCategoryInUseError);
  });

  it('retorna 404 quando a categoria não existe', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: 'missing-id' }),
    ).rejects.toBeInstanceOf(ProductCategoryNotFoundError);
  });
});
