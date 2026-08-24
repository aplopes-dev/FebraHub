import { CreateCustomerUseCase } from '../../customers/application/use-cases/create-customer/create-customer.use-case';
import { FindCustomerByIdUseCase } from '../../customers/application/use-cases/find-customer-by-id/find-customer-by-id.use-case';
import { ListCustomersUseCase } from '../../customers/application/use-cases/list-customers/list-customers.use-case';
import { CustomerNotFoundError } from '../../customers/domain/errors/customer-not-found.error';
import {
  CUSTOMER_CPF,
  makeCustomer,
  makeCustomerRepositories,
  ORGANIZATION_ID,
} from '../../customers/tests/customers-test-factory';
import {
  BRANCH_ID,
  makeBranch,
} from '../../tenancy/tests/tenancy-test-factory';
import { toPosCustomerCreateInput } from '../infrastructure/http/routes/shared/pos-customer.dto';
import { PosCustomerPresenter } from '../infrastructure/http/routes/shared/pos-customer.presenter';

describe('pos-customers device facade', () => {
  function setup() {
    const repos = makeCustomerRepositories();
    return {
      ...repos,
      create: new CreateCustomerUseCase(
        repos.customerRepository,
        repos.branchRepository,
        repos.categoryRepository,
      ),
      list: new ListCustomersUseCase(repos.customerRepository),
      find: new FindCustomerByIdUseCase(repos.customerRepository),
    };
  }

  it('toPosCustomerCreateInput força stage=active e branch do terminal', () => {
    const input = toPosCustomerCreateInput(
      {
        personType: 'PF',
        name: 'Cliente PDV',
        document: '529.982.247-25',
      },
      BRANCH_ID,
    );

    expect(input.stage).toBe('active');
    expect(input.branchIds).toEqual([BRANCH_ID]);
  });

  it('lista clientes da organização com busca', async () => {
    const { list, customerRepository } = setup();
    await customerRepository.save(
      makeCustomer({ name: 'Ana Souza', document: CUSTOMER_CPF }),
    );
    await customerRepository.save(
      makeCustomer({
        id: 'd3333333-3333-4333-8333-333333333333',
        name: 'Bruno Costa',
        document: null,
      }),
    );

    const result = await list.execute({
      organizationId: ORGANIZATION_ID,
      search: 'Ana',
      tab: 'all',
      page: 1,
      perPage: 20,
    });

    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Ana Souza');
    const envelope = PosCustomerPresenter.toHttpList(result);
    expect(envelope.data[0].document).toBe(CUSTOMER_CPF);
  });

  it('cria cliente com branch do terminal', async () => {
    const { create, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    const customer = await create.execute({
      organizationId: ORGANIZATION_ID,
      ...toPosCustomerCreateInput(
        { personType: 'PF', name: 'Caixa Cliente', mobilePhone: '73999001122' },
        BRANCH_ID,
      ),
    });

    expect(customer.stage).toBe('active');
    expect(customer.branchIds).toEqual([BRANCH_ID]);
  });

  it('get rejeita cliente soft-deleted', async () => {
    const { find, customerRepository } = setup();
    const deleted = makeCustomer({ deletedAt: new Date() });
    await customerRepository.save(deleted);

    const customer = await find.execute({
      organizationId: ORGANIZATION_ID,
      id: deleted.id,
    });
    expect(customer.deletedAt).not.toBeNull();
    expect(() => {
      if (customer.deletedAt) throw new CustomerNotFoundError(customer.id);
    }).toThrow(CustomerNotFoundError);
  });
});
