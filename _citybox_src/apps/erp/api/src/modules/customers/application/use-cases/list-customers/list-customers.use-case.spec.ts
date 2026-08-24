import { ListCustomersUseCase } from './list-customers.use-case';
import {
  makeCustomer,
  makeCustomerRepositories,
  ORGANIZATION_ID,
  OTHER_CUSTOMER_ID,
} from '../../../tests/customers-test-factory';

describe('ListCustomersUseCase', () => {
  function setup() {
    const repos = makeCustomerRepositories();
    const useCase = new ListCustomersUseCase(repos.customerRepository);
    return { ...repos, useCase };
  }

  it('filtra por estágio e monta tabCounts sobre a base', async () => {
    const { useCase, customerRepository } = setup();
    await customerRepository.save(makeCustomer({ stage: 'lead' }));
    await customerRepository.save(
      makeCustomer({
        id: OTHER_CUSTOMER_ID,
        document: null,
        name: 'Bruno Ativo',
        stage: 'active',
        email: 'bruno@email.com',
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'active',
      page: 1,
      perPage: 10,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Bruno Ativo');
    expect(result.tabCounts).toEqual({
      all: 2,
      lead: 1,
      opportunity: 0,
      active: 1,
      inactive: 0,
    });
  });

  it('busca por nome e telefone', async () => {
    const { useCase, customerRepository } = setup();
    await customerRepository.save(
      makeCustomer({ name: 'Carla Souza', mobilePhone: '73988776655' }),
    );

    const byName = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'carla',
    });
    expect(byName.items).toHaveLength(1);

    const byPhone = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: '98877',
    });
    expect(byPhone.items).toHaveLength(1);
  });

  it('ignora soft-deleted na listagem e nos contadores', async () => {
    const { useCase, customerRepository } = setup();
    await customerRepository.save(makeCustomer().softDelete());

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items).toHaveLength(0);
    expect(result.tabCounts.all).toBe(0);
  });
});
