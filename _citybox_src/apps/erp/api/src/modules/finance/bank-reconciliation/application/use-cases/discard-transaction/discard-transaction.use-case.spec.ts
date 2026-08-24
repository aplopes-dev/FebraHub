import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  BANK_STATEMENT_ID,
  BANK_STATEMENT_TRANSACTION_ID,
  makeBankStatement,
  makeBankStatementTransaction,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { BankStatementTransactionNotPendingError } from '../../../domain/errors/bank-statement-transaction-not-pending.error';
import { DiscardTransactionUseCase } from './discard-transaction.use-case';

function setup() {
  const {
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
  } = makeBankReconciliationRepositories();

  const useCase = new DiscardTransactionUseCase(
    bankStatementRepository,
    bankStatementTransactionRepository,
  );

  return {
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
    useCase,
  };
}

describe('DiscardTransactionUseCase', () => {
  it('exclui uma transação pendente: vira discarded e recalcula os contadores do extrato', async () => {
    const ctx = setup();
    const statement = makeBankStatement({
      pendingCount: 1,
      reconciledCount: 0,
      discardedCount: 0,
    });
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({ status: 'pending' });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: BANK_STATEMENT_TRANSACTION_ID,
    });

    expect(result.transaction.status).toBe('discarded');
    expect(result.transaction.discardedAt).not.toBeNull();
    expect(result.bankStatement.discardedCount).toBe(1);
    expect(result.bankStatement.pendingCount).toBe(0);

    const persisted = await ctx.bankStatementTransactionRepository.findById(
      ORGANIZATION_ID,
      BANK_STATEMENT_TRANSACTION_ID,
    );
    expect(persisted!.status).toBe('discarded');
  });

  it('rejeita quando a transação já está conciliada', async () => {
    const ctx = setup();
    const statement = makeBankStatement();
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({ status: 'reconciled' });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: BANK_STATEMENT_TRANSACTION_ID,
      }),
    ).rejects.toBeInstanceOf(BankStatementTransactionNotPendingError);
  });

  it('rejeita quando a transação já está excluída', async () => {
    const ctx = setup();
    const statement = makeBankStatement();
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({ status: 'discarded' });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: BANK_STATEMENT_TRANSACTION_ID,
      }),
    ).rejects.toBeInstanceOf(BankStatementTransactionNotPendingError);
  });

  it('rejeita extrato de outra organização', async () => {
    const ctx = setup();
    const statement = makeBankStatement();
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({ status: 'pending' });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(
      ctx.useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: BANK_STATEMENT_TRANSACTION_ID,
      }),
    ).rejects.toBeInstanceOf(BankStatementNotFoundError);
  });

  it('rejeita transação que não pertence ao extrato informado', async () => {
    const ctx = setup();
    const statement = makeBankStatement();
    await ctx.bankStatementRepository.save(statement);
    const otherStatement = makeBankStatement({ id: 'other-statement' });
    await ctx.bankStatementRepository.save(otherStatement);
    const transaction = makeBankStatementTransaction({
      bankStatementId: otherStatement.id,
      status: 'pending',
    });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: statement.id,
        transactionId: transaction.id,
      }),
    ).rejects.toBeInstanceOf(BankStatementTransactionNotFoundError);
  });
});
