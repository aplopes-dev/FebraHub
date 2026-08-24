import { CreateCustomerUseCase } from './create-customer.use-case';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { makeCustomerCategory } from '../../../customer-categories/tests/customer-categories-test-factory';
import { CustomerCategoryNotFoundError } from '../../../customer-categories/domain/errors/customer-category-not-found.error';
import { CustomerDocumentTakenError } from '../../../domain/errors/customer-document-taken.error';
import {
  CUSTOMER_CPF,
  CUSTOMER_DOCUMENT,
  makeCustomer,
  makeCustomerRepositories,
  ORGANIZATION_ID,
} from '../../../tests/customers-test-factory';

describe('CreateCustomerUseCase', () => {
  function setup() {
    const repos = makeCustomerRepositories();
    const useCase = new CreateCustomerUseCase(
      repos.customerRepository,
      repos.branchRepository,
      repos.categoryRepository,
    );
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      personType: 'PF' as const,
      name: '  Ana Costa  ',
      document: '529.982.247-25',
      email: 'Ana@Email.COM',
      mobilePhone: '73999112233',
    };
  }

  it('cria cliente normalizando documento e e-mail', async () => {
    const { useCase } = setup();

    const customer = await useCase.execute(baseInput());

    expect(customer.name).toBe('Ana Costa');
    expect(customer.document).toBe(CUSTOMER_CPF);
    expect(customer.email).toBe('ana@email.com');
    expect(customer.stage).toBe('lead');
    expect(customer.deletedAt).toBeNull();
  });

  it('permite criar sem documento', async () => {
    const { useCase } = setup();

    const customer = await useCase.execute({
      ...baseInput(),
      document: null,
    });

    expect(customer.document).toBeNull();
  });

  it('vincula unidades e categoria', async () => {
    const { useCase, branchRepository, categoryRepository } = setup();
    await branchRepository.save(makeBranch());
    const category = makeCustomerCategory();
    await categoryRepository.save(category);

    const customer = await useCase.execute({
      ...baseInput(),
      branchIds: [BRANCH_ID, BRANCH_ID],
      categoryId: category.id,
      addresses: [
        {
          addressType: 'principal',
          zipCode: '45650-100',
          street: 'Rua A',
          number: '10',
          district: 'Centro',
          city: 'Ilhéus',
          state: 'ba',
        },
      ],
    });

    expect(customer.branchIds).toEqual([BRANCH_ID]);
    expect(customer.categoryId).toBe(category.id);
    expect(customer.addresses).toHaveLength(1);
    expect(customer.addresses[0].state).toBe('BA');
  });

  it('rejeita dois endereços principais', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        ...baseInput(),
        addresses: [
          { addressType: 'principal', city: 'Ilhéus', state: 'BA' },
          { addressType: 'principal', city: 'Itabuna', state: 'BA' },
        ],
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita documento duplicado', async () => {
    const { useCase, customerRepository } = setup();
    await customerRepository.save(makeCustomer());

    await expect(
      useCase.execute({ ...baseInput(), document: CUSTOMER_CPF }),
    ).rejects.toBeInstanceOf(CustomerDocumentTakenError);
  });

  it('rejeita unidade inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        ...baseInput(),
        branchIds: [BRANCH_ID],
      }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('rejeita categoria inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        ...baseInput(),
        document: CUSTOMER_DOCUMENT,
        categoryId: 'c1111111-1111-4111-8111-111111111111',
      }),
    ).rejects.toBeInstanceOf(CustomerCategoryNotFoundError);
  });
});
