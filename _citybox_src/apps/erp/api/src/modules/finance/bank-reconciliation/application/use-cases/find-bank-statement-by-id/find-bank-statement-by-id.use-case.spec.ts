import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  makeBankStatement,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { FindBankStatementByIdUseCase } from './find-bank-statement-by-id.use-case';

function setup() {
  const { bankStatementRepository } = makeBankReconciliationRepositories();
  const useCase = new FindBankStatementByIdUseCase(bankStatementRepository);
  return { bankStatementRepository, useCase };
}

describe('FindBankStatementByIdUseCase', () => {
  it('encontra o extrato na organização certa', async () => {
    const { bankStatementRepository, useCase } = setup();
    await bankStatementRepository.save(makeBankStatement());

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: (await bankStatementRepository.findAll(ORGANIZATION_ID))[0].id,
    });

    expect(result.organizationId).toBe(ORGANIZATION_ID);
  });

  it('lança BankStatementNotFoundError quando o extrato é de outra organização', async () => {
    const { bankStatementRepository, useCase } = setup();
    const statement = makeBankStatement();
    await bankStatementRepository.save(statement);

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: statement.id,
      }),
    ).rejects.toBeInstanceOf(BankStatementNotFoundError);
  });
});
