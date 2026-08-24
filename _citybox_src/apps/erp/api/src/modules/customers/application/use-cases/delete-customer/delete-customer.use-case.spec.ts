import { DeleteCustomerUseCase } from './delete-customer.use-case';
import { RestoreCustomerUseCase } from '../restore-customer/restore-customer.use-case';
import { CustomerNotFoundError } from '../../../domain/errors/customer-not-found.error';
import {
  CUSTOMER_ID,
  makeCustomer,
  makeCustomerRepositories,
  ORGANIZATION_ID,
} from '../../../tests/customers-test-factory';

describe('DeleteCustomerUseCase / RestoreCustomerUseCase', () => {
  function setup() {
    const repos = makeCustomerRepositories();
    return {
      ...repos,
      deleteUseCase: new DeleteCustomerUseCase(repos.customerRepository),
      restoreUseCase: new RestoreCustomerUseCase(repos.customerRepository),
    };
  }

  it('faz soft-delete e restaura de forma idempotente', async () => {
    const { deleteUseCase, restoreUseCase, customerRepository } = setup();
    await customerRepository.save(makeCustomer());

    await deleteUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CUSTOMER_ID,
    });

    const deleted = await customerRepository.findById(
      ORGANIZATION_ID,
      CUSTOMER_ID,
    );
    expect(deleted?.deletedAt).not.toBeNull();

    const restored = await restoreUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CUSTOMER_ID,
    });
    expect(restored.deletedAt).toBeNull();

    const again = await restoreUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CUSTOMER_ID,
    });
    expect(again.deletedAt).toBeNull();
  });

  it('404 ao excluir cliente já excluído', async () => {
    const { deleteUseCase, customerRepository } = setup();
    await customerRepository.save(makeCustomer().softDelete());

    await expect(
      deleteUseCase.execute({
        organizationId: ORGANIZATION_ID,
        id: CUSTOMER_ID,
      }),
    ).rejects.toBeInstanceOf(CustomerNotFoundError);
  });
});
