import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  BANK_ACCOUNT_ID,
  OTHER_BANK_ACCOUNT_ID,
  makeBankStatement,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { ListBankStatementsUseCase } from './list-bank-statements.use-case';

function setup() {
  const { bankStatementRepository } = makeBankReconciliationRepositories();
  const useCase = new ListBankStatementsUseCase(bankStatementRepository);
  return { bankStatementRepository, useCase };
}

describe('ListBankStatementsUseCase', () => {
  it('pagina e isola por organização', async () => {
    const { bankStatementRepository, useCase } = setup();
    await bankStatementRepository.save(makeBankStatement({ id: 's1' }));
    await bankStatementRepository.save(makeBankStatement({ id: 's2' }));
    await bankStatementRepository.save(
      makeBankStatement({ id: 's3', organizationId: OTHER_ORGANIZATION_ID }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      page: 1,
      perPage: 1,
    });

    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(1);
  });

  it('filtra por bankAccountId e status', async () => {
    const { bankStatementRepository, useCase } = setup();
    await bankStatementRepository.save(
      makeBankStatement({
        id: 's1',
        bankAccountId: BANK_ACCOUNT_ID,
        status: 'reconciled',
      }),
    );
    await bankStatementRepository.save(
      makeBankStatement({ id: 's2', bankAccountId: OTHER_BANK_ACCOUNT_ID }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      status: 'reconciled',
      page: 1,
      perPage: 10,
    });

    expect(result.data.map((s) => s.id)).toEqual(['s1']);
  });
});
