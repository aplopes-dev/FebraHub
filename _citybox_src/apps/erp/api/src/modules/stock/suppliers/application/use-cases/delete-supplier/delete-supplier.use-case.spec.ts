import { DeleteSupplierUseCase } from './delete-supplier.use-case';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../../tenancy/tests/tenancy-test-factory';
import { SupplierNotFoundError } from '../../../domain/errors/supplier-not-found.error';
import {
  makeRepositories,
  makeSupplier,
  SUPPLIER_ID,
} from '../../../tests/suppliers-test-factory';

describe('DeleteSupplierUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new DeleteSupplierUseCase(repos.supplierRepository);
    return { ...repos, useCase };
  }

  it('marca o fornecedor como excluído sem apagá-lo', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: SUPPLIER_ID,
    });

    const stored = await supplierRepository.findById(
      ORGANIZATION_ID,
      SUPPLIER_ID,
    );
    expect(stored?.deletedAt).toBeInstanceOf(Date);
  });

  it('responde 404 ao excluir duas vezes', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier().softDelete());

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, id: SUPPLIER_ID }),
    ).rejects.toBeInstanceOf(SupplierNotFoundError);
  });

  it('responde 404 para fornecedor de outra organização', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier());

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: SUPPLIER_ID,
      }),
    ).rejects.toBeInstanceOf(SupplierNotFoundError);
  });
});
