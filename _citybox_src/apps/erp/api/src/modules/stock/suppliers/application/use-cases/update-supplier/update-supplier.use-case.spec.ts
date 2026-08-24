import { UpdateSupplierUseCase } from './update-supplier.use-case';
import { BranchNotFoundError } from '../../../../../tenancy/domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
  makeCnpj,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../../tenancy/tests/tenancy-test-factory';
import { SupplierDocumentTakenError } from '../../../domain/errors/supplier-document-taken.error';
import { SupplierNotFoundError } from '../../../domain/errors/supplier-not-found.error';
import {
  makeRepositories,
  makeSupplier,
  OTHER_SUPPLIER_ID,
  SUPPLIER_DOCUMENT,
  SUPPLIER_ID,
} from '../../../tests/suppliers-test-factory';

describe('UpdateSupplierUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new UpdateSupplierUseCase(
      repos.supplierRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      id: SUPPLIER_ID,
      personType: 'PJ' as const,
      name: 'Distribuidora Bahia',
      legalName: 'Distribuidora Bahia de Alimentos Ltda',
      document: SUPPLIER_DOCUMENT,
    };
  }

  it('limpa o campo omitido — semântica de PUT', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier());

    const updated = await useCase.execute(baseInput());

    expect(updated.contact.email).toBeNull();
    expect(updated.address.city).toBeNull();
    expect(updated.note).toBe('');
  });

  it('aceita corrigir o documento do fornecedor', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier());

    const updated = await useCase.execute({
      ...baseInput(),
      document: '11.222.363/0001-98',
    });

    expect(updated.document).toBe('11222363000198');
  });

  it('rejeita documento que já pertence a outro fornecedor', async () => {
    const { useCase, supplierRepository } = setup();
    const other = makeCnpj(11);
    await supplierRepository.save(makeSupplier());
    await supplierRepository.save(
      makeSupplier({
        id: OTHER_SUPPLIER_ID,
        name: 'Maria Hortifruti',
        document: other,
      }),
    );

    await expect(
      useCase.execute({ ...baseInput(), document: other }),
    ).rejects.toBeInstanceOf(SupplierDocumentTakenError);
  });

  it('aceita reenviar o próprio documento', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier());

    const updated = await useCase.execute({
      ...baseInput(),
      name: 'Distribuidora Bahia Sul',
    });

    expect(updated.name).toBe('Distribuidora Bahia Sul');
    expect(updated.document).toBe(SUPPLIER_DOCUMENT);
  });

  it('troca as unidades atendidas', async () => {
    const { useCase, supplierRepository, branchRepository } = setup();
    await branchRepository.save(makeBranch());
    await supplierRepository.save(makeSupplier({ branchIds: [] }));

    const updated = await useCase.execute({
      ...baseInput(),
      branchIds: [BRANCH_ID],
    });

    expect(updated.branchIds).toEqual([BRANCH_ID]);
  });

  it('rejeita unidade de outra organização', async () => {
    const { useCase, supplierRepository, branchRepository } = setup();
    await supplierRepository.save(makeSupplier());
    await branchRepository.save(
      makeBranch({
        id: OTHER_BRANCH_ID,
        organizationId: OTHER_ORGANIZATION_ID,
        document: makeCnpj(20),
      }),
    );

    await expect(
      useCase.execute({ ...baseInput(), branchIds: [OTHER_BRANCH_ID] }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('responde 404 para fornecedor excluído', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier().softDelete());

    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      SupplierNotFoundError,
    );
  });
});
