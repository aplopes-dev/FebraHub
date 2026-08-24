import { CreateSupplierUseCase } from './create-supplier.use-case';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
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
import {
  makeRepositories,
  makeSupplier,
  SUPPLIER_CPF,
  SUPPLIER_DOCUMENT,
} from '../../../tests/suppliers-test-factory';

describe('CreateSupplierUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new CreateSupplierUseCase(
      repos.supplierRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      personType: 'PJ' as const,
      name: '  Distribuidora Pontal  ',
      legalName: 'Distribuidora Pontal Ltda',
      document: '11.222.363/0001-98',
      email: 'Vendas@Pontal.com.BR',
    };
  }

  it('cria o fornecedor com documento só de dígitos e e-mail em minúsculas', async () => {
    const { useCase } = setup();

    const supplier = await useCase.execute(baseInput());

    expect(supplier.name).toBe('Distribuidora Pontal');
    expect(supplier.document).toBe('11222363000198');
    expect(supplier.contact.email).toBe('vendas@pontal.com.br');
    expect(supplier.stateExempt).toBe(false);
    expect(supplier.note).toBe('');
    expect(supplier.branchIds).toEqual([]);
    expect(supplier.deletedAt).toBeNull();
  });

  it('vincula as unidades informadas, sem repetir id', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    const supplier = await useCase.execute({
      ...baseInput(),
      branchIds: [BRANCH_ID, BRANCH_ID],
    });

    expect(supplier.branchIds).toEqual([BRANCH_ID]);
  });

  it('limpa a inscrição estadual quando o fornecedor é isento', async () => {
    const { useCase } = setup();

    const supplier = await useCase.execute({
      ...baseInput(),
      stateExempt: true,
      stateRegistration: '123456',
    });

    expect(supplier.stateExempt).toBe(true);
    expect(supplier.stateRegistration).toBeNull();
  });

  it('rejeita documento já usado na organização', async () => {
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier());

    await expect(
      useCase.execute({ ...baseInput(), document: SUPPLIER_DOCUMENT }),
    ).rejects.toBeInstanceOf(SupplierDocumentTakenError);
  });

  it('aponta a restauração quando o documento é de um fornecedor excluído', async () => {
    // O unique do banco (`organizationId, document`) não conhece soft-delete:
    // se a checagem ignorasse os excluídos, o INSERT estouraria como 500.
    const { useCase, supplierRepository } = setup();
    await supplierRepository.save(makeSupplier().softDelete());

    const error = await useCase
      .execute({ ...baseInput(), document: SUPPLIER_DOCUMENT })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SupplierDocumentTakenError);
    expect((error as SupplierDocumentTakenError).externalMessage).toMatch(
      /excluído com este CNPJ\/CPF/i,
    );
  });

  it('rejeita CNPJ inválido para pessoa jurídica', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ ...baseInput(), document: '11.222.333/0001-00' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita CPF no lugar de CNPJ quando o tipo é pessoa jurídica', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ ...baseInput(), document: SUPPLIER_CPF }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('aceita CPF quando o tipo é pessoa física', async () => {
    const { useCase } = setup();

    const supplier = await useCase.execute({
      ...baseInput(),
      personType: 'PF',
      document: '529.982.247-25',
    });

    expect(supplier.personType).toBe('PF');
    expect(supplier.document).toBe(SUPPLIER_CPF);
  });

  it('rejeita unidade de outra organização', async () => {
    const { useCase, branchRepository } = setup();
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

  it('rejeita unidade excluída', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch().softDelete());

    await expect(
      useCase.execute({ ...baseInput(), branchIds: [BRANCH_ID] }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
