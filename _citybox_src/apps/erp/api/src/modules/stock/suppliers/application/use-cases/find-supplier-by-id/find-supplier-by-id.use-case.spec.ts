import { FindSupplierByIdUseCase } from './find-supplier-by-id.use-case';
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

describe('FindSupplierByIdUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new FindSupplierByIdUseCase(repos.supplierRepository);
    return { ...repos, useCase };
  }

  it('devolve o fornecedor da organização ativa', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier());

    const supplier = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: SUPPLIER_ID,
    });

    expect(supplier.id).toBe(SUPPLIER_ID);
  });

  it('devolve o fornecedor excluído — a aba "Excluídos" leva até ele', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier().softDelete());

    const supplier = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: SUPPLIER_ID,
    });

    expect(supplier.deletedAt).not.toBeNull();
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
