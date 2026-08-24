import { RestoreSupplierUseCase } from './restore-supplier.use-case';
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

describe('RestoreSupplierUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new RestoreSupplierUseCase(repos.supplierRepository);
    return { ...repos, useCase };
  }

  it('devolve o fornecedor às abas ativas', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier().softDelete());

    const restored = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: SUPPLIER_ID,
    });

    expect(restored.deletedAt).toBeNull();
    const stored = await supplierRepository.findById(
      ORGANIZATION_ID,
      SUPPLIER_ID,
    );
    expect(stored?.deletedAt).toBeNull();
  });

  it('é idempotente para fornecedor já ativo', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier());

    const restored = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: SUPPLIER_ID,
    });

    expect(restored.deletedAt).toBeNull();
  });

  it('responde 404 para fornecedor de outra organização', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier().softDelete());

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: SUPPLIER_ID,
      }),
    ).rejects.toBeInstanceOf(SupplierNotFoundError);
  });
});
