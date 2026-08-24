import { CreateCustomerCategoryUseCase } from './create-customer-category.use-case';
import { CustomerCategoryNameTakenError } from '../../../domain/errors/customer-category-name-taken.error';
import {
  makeCategoryRepositories,
  makeCustomerCategory,
  ORGANIZATION_ID,
} from '../../../tests/customer-categories-test-factory';

describe('CreateCustomerCategoryUseCase', () => {
  function setup() {
    const repos = makeCategoryRepositories();
    const useCase = new CreateCustomerCategoryUseCase(repos.categoryRepository);
    return { ...repos, useCase };
  }

  it('cria a categoria com desconto padrão 0', async () => {
    const { useCase } = setup();

    const category = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: '  Atacado  ',
    });

    expect(category.name).toBe('Atacado');
    expect(category.discountPercentage).toBe(0);
  });

  it('rejeita nome já usado na organização', async () => {
    const { useCase, categoryRepository } = setup();
    await categoryRepository.save(makeCustomerCategory({ name: 'VIP' }));

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, name: 'vip' }),
    ).rejects.toBeInstanceOf(CustomerCategoryNameTakenError);
  });
});
