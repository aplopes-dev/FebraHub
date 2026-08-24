import { DeleteCustomerCategoryUseCase } from './delete-customer-category.use-case';
import { CustomerCategoryInUseError } from '../../../domain/errors/customer-category-in-use.error';
import { CustomerCategoryNotFoundError } from '../../../domain/errors/customer-category-not-found.error';
import {
  CUSTOMER_CATEGORY_ID,
  makeCategoryRepositories,
  makeCustomerCategory,
  ORGANIZATION_ID,
} from '../../../tests/customer-categories-test-factory';

describe('DeleteCustomerCategoryUseCase', () => {
  function setup() {
    const repos = makeCategoryRepositories();
    const useCase = new DeleteCustomerCategoryUseCase(repos.categoryRepository);
    return { ...repos, useCase };
  }

  it('exclui categoria sem clientes', async () => {
    const { useCase, categoryRepository } = setup();
    await categoryRepository.save(makeCustomerCategory());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CUSTOMER_CATEGORY_ID,
    });

    expect(
      await categoryRepository.findById(ORGANIZATION_ID, CUSTOMER_CATEGORY_ID),
    ).toBeNull();
  });

  it('bloqueia exclusão quando há clientes vinculados', async () => {
    const { useCase, categoryRepository } = setup();
    await categoryRepository.save(makeCustomerCategory());
    categoryRepository.linkCustomer(
      CUSTOMER_CATEGORY_ID,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: CUSTOMER_CATEGORY_ID,
      }),
    ).rejects.toBeInstanceOf(CustomerCategoryInUseError);
  });

  it('404 se a categoria não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: CUSTOMER_CATEGORY_ID,
      }),
    ).rejects.toBeInstanceOf(CustomerCategoryNotFoundError);
  });
});
