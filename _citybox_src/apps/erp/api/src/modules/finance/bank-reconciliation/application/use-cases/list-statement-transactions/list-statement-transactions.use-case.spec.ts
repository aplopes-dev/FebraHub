import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  makeBankStatement,
  makeBankStatementTransaction,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { ListStatementTransactionsUseCase } from './list-statement-transactions.use-case';

function setup() {
  const { bankStatementRepository, bankStatementTransactionRepository } =
    makeBankReconciliationRepositories();
  const useCase = new ListStatementTransactionsUseCase(
    bankStatementRepository,
    bankStatementTransactionRepository,
  );
  return {
    bankStatementRepository,
    bankStatementTransactionRepository,
    useCase,
  };
}

describe('ListStatementTransactionsUseCase', () => {
  it('lista as transações pendentes recém-importadas', async () => {
    const {
      bankStatementRepository,
      bankStatementTransactionRepository,
      useCase,
    } = setup();
    const statement = makeBankStatement();
    await bankStatementRepository.save(statement);
    await bankStatementTransactionRepository.saveMany([
      makeBankStatementTransaction({ id: 't1', memo: 'TED RECEBIDA' }),
      makeBankStatementTransaction({
        id: 't2',
        memo: 'PAGAMENTO CONTA DE LUZ',
      }),
    ]);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: statement.id,
      status: 'pending',
      page: 1,
      perPage: 10,
    });

    expect(result.total).toBe(2);
    expect(result.data.every((t) => t.status === 'pending')).toBe(true);
  });

  it('filtra por busca no memo', async () => {
    const {
      bankStatementRepository,
      bankStatementTransactionRepository,
      useCase,
    } = setup();
    const statement = makeBankStatement();
    await bankStatementRepository.save(statement);
    await bankStatementTransactionRepository.saveMany([
      makeBankStatementTransaction({ id: 't1', memo: 'TED RECEBIDA' }),
      makeBankStatementTransaction({
        id: 't2',
        memo: 'PAGAMENTO CONTA DE LUZ',
      }),
    ]);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: statement.id,
      status: 'pending',
      search: 'luz',
      page: 1,
      perPage: 10,
    });

    expect(result.data.map((t) => t.id)).toEqual(['t2']);
  });

  it('filtra por período (postedFrom/postedTo) — FR-035/D15', async () => {
    const {
      bankStatementRepository,
      bankStatementTransactionRepository,
      useCase,
    } = setup();
    const statement = makeBankStatement();
    await bankStatementRepository.save(statement);
    await bankStatementTransactionRepository.saveMany([
      makeBankStatementTransaction({
        id: 't1',
        memo: 'DENTRO DO PERIODO',
        postedAt: new Date('2026-07-10T00:00:00.000Z'),
      }),
      makeBankStatementTransaction({
        id: 't2',
        memo: 'FORA DO PERIODO',
        postedAt: new Date('2026-07-25T00:00:00.000Z'),
      }),
    ]);

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: statement.id,
      status: 'pending',
      postedFrom: new Date('2026-07-01T00:00:00.000Z'),
      postedTo: new Date('2026-07-15T00:00:00.000Z'),
      page: 1,
      perPage: 10,
    });

    expect(result.data.map((t) => t.id)).toEqual(['t1']);
  });

  it('lança BankStatementNotFoundError para extrato de outra organização', async () => {
    const { bankStatementRepository, useCase } = setup();
    const statement = makeBankStatement();
    await bankStatementRepository.save(statement);

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        bankStatementId: statement.id,
        status: 'pending',
        page: 1,
        perPage: 10,
      }),
    ).rejects.toBeInstanceOf(BankStatementNotFoundError);
  });
});
