import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  BANK_STATEMENT_ID,
  BANK_STATEMENT_TRANSACTION_ID,
  makeBankStatement,
  makeBankStatementTransaction,
  makeBankStatementMatch,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { BankStatementTransactionNotReconciledError } from '../../../domain/errors/bank-statement-transaction-not-reconciled.error';
import { UndoReconciliationUseCase } from './undo-reconciliation.use-case';

function setup() {
  const {
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
  } = makeBankReconciliationRepositories();

  const useCase = new UndoReconciliationUseCase(
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
  );

  return {
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
    useCase,
  };
}

describe('UndoReconciliationUseCase', () => {
  it('desfaz uma transação conciliada: volta para pending e apaga os matches', async () => {
    const ctx = setup();
    const statement = makeBankStatement({
      pendingCount: 0,
      reconciledCount: 1,
      discardedCount: 0,
    });
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({ status: 'reconciled' });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);
    const match = makeBankStatementMatch();
    await ctx.bankStatementMatchRepository.saveMany([match]);

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: BANK_STATEMENT_TRANSACTION_ID,
    });

    expect(result.transaction.status).toBe('pending');
    expect(result.transaction.reconciledAt).toBeNull();
    expect(result.bankStatement.reconciledCount).toBe(0);
    expect(result.bankStatement.pendingCount).toBe(1);

    const remainingMatches =
      await ctx.bankStatementMatchRepository.findActiveFinancialEntryIds(
        ORGANIZATION_ID,
        [match.financialEntryId],
      );
    expect(remainingMatches.has(match.financialEntryId)).toBe(false);

    const savedTransaction =
      await ctx.bankStatementTransactionRepository.findById(
        ORGANIZATION_ID,
        BANK_STATEMENT_TRANSACTION_ID,
      );
    expect(savedTransaction?.status).toBe('pending');
  });

  it('lança BankStatementNotFoundError quando o extrato não existe', async () => {
    const ctx = setup();

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: BANK_STATEMENT_TRANSACTION_ID,
      }),
    ).rejects.toBeInstanceOf(BankStatementNotFoundError);
  });

  it('lança BankStatementTransactionNotFoundError quando a transação não existe', async () => {
    const ctx = setup();
    await ctx.bankStatementRepository.save(makeBankStatement());

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: BANK_STATEMENT_TRANSACTION_ID,
      }),
    ).rejects.toBeInstanceOf(BankStatementTransactionNotFoundError);
  });

  it('lança BankStatementTransactionNotReconciledError quando a transação ainda está pending', async () => {
    const ctx = setup();
    await ctx.bankStatementRepository.save(makeBankStatement());
    await ctx.bankStatementTransactionRepository.saveMany([
      makeBankStatementTransaction({ status: 'pending' }),
    ]);

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: BANK_STATEMENT_TRANSACTION_ID,
      }),
    ).rejects.toBeInstanceOf(BankStatementTransactionNotReconciledError);
  });

  it('não enxerga extrato/transação de outra organização', async () => {
    const ctx = setup();
    await ctx.bankStatementRepository.save(
      makeBankStatement({ organizationId: OTHER_ORGANIZATION_ID }),
    );
    await ctx.bankStatementTransactionRepository.saveMany([
      makeBankStatementTransaction({
        organizationId: OTHER_ORGANIZATION_ID,
        status: 'reconciled',
      }),
    ]);

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: BANK_STATEMENT_TRANSACTION_ID,
      }),
    ).rejects.toBeInstanceOf(BankStatementNotFoundError);
  });
});
