import { CreateBranchUseCase } from './create-branch.use-case';
import { BranchCodeTakenError } from '../../../domain/errors/branch-code-taken.error';
import { BranchDocumentTakenError } from '../../../domain/errors/branch-document-taken.error';
import { HeadquartersDuplicateError } from '../../../domain/errors/headquarters-duplicate.error';
import {
  BRANCH_DOCUMENT,
  makeBranch,
  makeCnpj,
  makeRepositories,
  ORGANIZATION_ID,
} from '../../../tests/tenancy-test-factory';

describe('CreateBranchUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new CreateBranchUseCase(repos.branchRepository);
    return { ...repos, useCase };
  }

  function baseInput() {
    return {
      organizationId: ORGANIZATION_ID,
      code: '002',
      personType: 'PJ' as const,
      document: makeCnpj(2),
      legalName: 'Comércio Ilhéus Ltda',
      tradeName: 'Loja Pontal',
    };
  }

  it('rejeita reusar o código de uma unidade desativada, apontando a reativação', async () => {
    // O unique do banco (`organizationId, code`) não conhece soft-delete: se a
    // checagem ignorasse as desativadas, o INSERT estouraria como 500.
    const { useCase, branchRepository } = setup();
    await branchRepository.save(
      makeBranch({ code: '002', document: makeCnpj(2) }).softDelete(),
    );

    const error = await useCase.execute(baseInput()).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BranchCodeTakenError);
    // A mensagem externa é a que o usuário lê — e precisa apontar a saída
    // (reativar), já que a unidade em conflito não aparece na listagem.
    expect((error as BranchCodeTakenError).externalMessage).toMatch(
      /desativada com o código/i,
    );
  });

  it('rejeita reusar o documento de uma unidade desativada', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(
      makeBranch({ code: '090', document: makeCnpj(2) }).softDelete(),
    );

    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      BranchDocumentTakenError,
    );
  });

  it('cria a unidade com os padrões de regime tributário e fuso', async () => {
    const { useCase } = setup();

    const branch = await useCase.execute({
      ...baseInput(),
      document: '11.222.335/0001-70',
    });

    expect(branch.code).toBe('002');
    expect(branch.document).toBe(makeCnpj(2));
    expect(branch.taxRegime).toBe('SIMPLES_NACIONAL');
    expect(branch.timezone).toBe('America/Bahia');
    expect(branch.isHeadquarters).toBe(false);
    expect(branch.active).toBe(true);
  });

  it('rejeita código já usado na organização', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch({ code: '002' }));

    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      BranchCodeTakenError,
    );
  });

  it('rejeita documento já usado na organização', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(
      makeBranch({ code: '001', document: BRANCH_DOCUMENT }),
    );

    await expect(
      useCase.execute({ ...baseInput(), document: BRANCH_DOCUMENT }),
    ).rejects.toBeInstanceOf(BranchDocumentTakenError);
  });

  it('rejeita uma segunda matriz na mesma organização', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(
      makeBranch({ code: '001', isHeadquarters: true }),
    );

    await expect(
      useCase.execute({ ...baseInput(), isHeadquarters: true }),
    ).rejects.toBeInstanceOf(HeadquartersDuplicateError);
  });
});
