import { UpdateCustomerUseCase } from './update-customer.use-case';
import {
  CUSTOMER_ID,
  makeCustomer,
  makeCustomerRepositories,
  ORGANIZATION_ID,
} from '../../../tests/customers-test-factory';

describe('UpdateCustomerUseCase', () => {
  function setup() {
    const repos = makeCustomerRepositories();
    const useCase = new UpdateCustomerUseCase(
      repos.customerRepository,
      repos.branchRepository,
      repos.categoryRepository,
    );
    return { ...repos, useCase };
  }

  it('PUT limpa campos omitidos', async () => {
    const { useCase, customerRepository } = setup();
    await customerRepository.save(
      makeCustomer({
        email: 'maria@email.com',
        mobilePhone: '73999887766',
      }),
    );

    const updated = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CUSTOMER_ID,
      personType: 'PF',
      name: 'Maria Silva',
      document: null,
      branchIds: [],
    });

    expect(updated.email).toBeNull();
    expect(updated.mobilePhone).toBeNull();
    expect(updated.notes).toBe('');
    expect(updated.document).toBeNull();
  });
});
