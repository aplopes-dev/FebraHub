import { FinancialEntry } from '../../../../financial-entries/domain/entities/financial-entry.entity';
import { FinancialEntryNotFoundError } from '../../../../financial-entries/domain/errors/financial-entry-not-found.error';
import {
  makeFinancialEntry,
  makeFinancialEntryRepositories,
} from '../../../../financial-entries/tests/financial-entries-test-factory';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  BANK_STATEMENT_ID,
  makeBankStatement,
  makeBankStatementTransaction,
  makeBankStatementMatch,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { BankStatementTransactionNotPendingError } from '../../../domain/errors/bank-statement-transaction-not-pending.error';
import { FinancialEntryAlreadyReconciledError } from '../../../domain/errors/financial-entry-already-reconciled.error';
import { FinancialEntryPaymentAmbiguousError } from '../../../domain/errors/financial-entry-payment-ambiguous.error';
import { ReconciliationSumMismatchError } from '../../../domain/errors/reconciliation-sum-mismatch.error';
import { ReconcileTransactionUseCase } from './reconcile-transaction.use-case';

function setup() {
  const { financialEntryRepository } = makeFinancialEntryRepositories();
  const {
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
  } = makeBankReconciliationRepositories();

  const useCase = new ReconcileTransactionUseCase(
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
    financialEntryRepository,
  );

  return {
    financialEntryRepository,
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
    useCase,
  };
}

async function seedStatementAndTransaction(
  ctx: ReturnType<typeof setup>,
  overrides: Parameters<typeof makeBankStatementTransaction>[0] = {},
) {
  const statement = makeBankStatement();
  await ctx.bankStatementRepository.save(statement);
  const transaction = makeBankStatementTransaction(overrides);
  await ctx.bankStatementTransactionRepository.saveMany([transaction]);
  return { statement, transaction };
}

describe('ReconcileTransactionUseCase', () => {
  it('concilia 1:1 — marca o lançamento pago, cria o match, atualiza a transação e o extrato', async () => {
    const ctx = setup();
    const entry = makeFinancialEntry({ id: 'entry-1', amountCents: 15_000 });
    await ctx.financialEntryRepository.save(entry);
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 15_000,
    });

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      financialEntryIds: ['entry-1'],
    });

    expect(result.transaction.status).toBe('reconciled');
    expect(result.matches).toHaveLength(1);
    expect(result.bankStatement.pendingCount).toBe(0);
    expect(result.bankStatement.reconciledCount).toBe(1);
    expect(result.bankStatement.status).toBe('reconciled');

    const updatedEntry = await ctx.financialEntryRepository.findById(
      ORGANIZATION_ID,
      'entry-1',
    );
    expect(updatedEntry!.status).toBe('paid');
    expect(updatedEntry!.payments[0].paymentMethod).toBe(
      'conciliacao_bancaria',
    );
    expect(updatedEntry!.payments[0].paidAt).toEqual(transaction.postedAt);
  });

  it('concilia um lançamento isReadOnly (vinculado a venda) normalmente', async () => {
    const ctx = setup();
    const base = makeFinancialEntry({ id: 'entry-1', amountCents: 15_000 });
    const readOnlyEntry = FinancialEntry.with(
      { ...base.props, saleOrderId: 'so-1111-1111-1111-1111-111111111111' },
      base.id,
    );
    await ctx.financialEntryRepository.save(readOnlyEntry);
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 15_000,
    });

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      financialEntryIds: ['entry-1'],
    });

    expect(result.transaction.status).toBe('reconciled');
  });

  it('concilia N lançamentos somados (repasse agrupado)', async () => {
    const ctx = setup();
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({ id: 'e1', amountCents: 10_000 }),
    );
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({ id: 'e2', amountCents: 10_000 }),
    );
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({ id: 'e3', amountCents: 10_000 }),
    );
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 30_000,
    });

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      financialEntryIds: ['e1', 'e2', 'e3'],
    });

    expect(result.matches).toHaveLength(3);
    for (const id of ['e1', 'e2', 'e3']) {
      const entry = await ctx.financialEntryRepository.findById(
        ORGANIZATION_ID,
        id,
      );
      expect(entry!.status).toBe('paid');
    }
  });

  it('rejeita quando a soma dos lançamentos não fecha com o valor da transação, sem gravar nada', async () => {
    const ctx = setup();
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({ id: 'e1', amountCents: 10_000 }),
    );
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({ id: 'e2', amountCents: 10_000 }),
    );
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 30_000, // soma real = 20_000
    });

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: transaction.id,
        financialEntryIds: ['e1', 'e2'],
      }),
    ).rejects.toBeInstanceOf(ReconciliationSumMismatchError);

    const stillPending = await ctx.bankStatementTransactionRepository.findById(
      ORGANIZATION_ID,
      transaction.id,
    );
    expect(stillPending!.status).toBe('pending');
    const e1 = await ctx.financialEntryRepository.findById(
      ORGANIZATION_ID,
      'e1',
    );
    expect(e1!.status).toBe('pending');
    const matches = await ctx.bankStatementMatchRepository.findByTransactionId(
      ORGANIZATION_ID,
      transaction.id,
    );
    expect(matches).toHaveLength(0);
  });

  it('rejeita quando a transação não está pending', async () => {
    const ctx = setup();
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({ id: 'entry-1', amountCents: 15_000 }),
    );
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 15_000,
      status: 'discarded',
    });

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: transaction.id,
        financialEntryIds: ['entry-1'],
      }),
    ).rejects.toBeInstanceOf(BankStatementTransactionNotPendingError);
  });

  it('rejeita quando o lançamento não existe na organização', async () => {
    const ctx = setup();
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 15_000,
    });

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: transaction.id,
        financialEntryIds: ['does-not-exist'],
      }),
    ).rejects.toBeInstanceOf(FinancialEntryNotFoundError);
  });

  it('concilia um lançamento já `paid` (sem vínculo ativo) por vínculo apenas, sem novo pagamento (D16)', async () => {
    const ctx = setup();
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'entry-1',
        amountCents: 15_000,
        payments: [
          {
            id: 'p0',
            amountCents: 15_000,
            paidAt: new Date('2026-07-01T00:00:00.000Z'),
            paymentMethod: 'dinheiro',
            cardBrand: null,
          },
        ],
      }),
    );
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 15_000,
    });

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      financialEntryIds: ['entry-1'],
    });

    expect(result.transaction.status).toBe('reconciled');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].financialEntryPaymentId).toBe('p0');

    const updatedEntry = await ctx.financialEntryRepository.findById(
      ORGANIZATION_ID,
      'entry-1',
    );
    expect(updatedEntry!.status).toBe('paid');
    expect(updatedEntry!.payments).toHaveLength(1);
    expect(updatedEntry!.payments[0].id).toBe('p0');
    expect(updatedEntry!.payments[0].paymentMethod).toBe('dinheiro');
  });

  it('rejeita quando o lançamento `paid` já tem BankStatementMatch ativo com outra transação (FR-033)', async () => {
    const ctx = setup();
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'entry-1',
        amountCents: 15_000,
        payments: [
          {
            id: 'p0',
            amountCents: 15_000,
            paidAt: new Date('2026-07-01T00:00:00.000Z'),
            paymentMethod: 'dinheiro',
            cardBrand: null,
          },
        ],
      }),
    );
    await ctx.bankStatementMatchRepository.saveMany([
      makeBankStatementMatch({
        id: 'match-outro',
        bankStatementTransactionId: 'outra-transacao',
        financialEntryId: 'entry-1',
        financialEntryPaymentId: 'p0',
      }),
    ]);
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 15_000,
    });

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: transaction.id,
        financialEntryIds: ['entry-1'],
      }),
    ).rejects.toBeInstanceOf(FinancialEntryAlreadyReconciledError);
  });

  it('rejeita lançamento `paid` com mais de 1 pagamento — ambíguo qual vincular (D16)', async () => {
    const ctx = setup();
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'entry-1',
        amountCents: 15_000,
        payments: [
          {
            id: 'p0',
            amountCents: 10_000,
            paidAt: new Date('2026-07-01T00:00:00.000Z'),
            paymentMethod: 'dinheiro',
            cardBrand: null,
          },
          {
            id: 'p1',
            amountCents: 5_000,
            paidAt: new Date('2026-07-02T00:00:00.000Z'),
            paymentMethod: 'pix',
            cardBrand: null,
          },
        ],
      }),
    );
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 15_000,
    });

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: transaction.id,
        financialEntryIds: ['entry-1'],
      }),
    ).rejects.toBeInstanceOf(FinancialEntryPaymentAmbiguousError);
  });

  it('concilia soma mista — 1 lançamento pendente + 1 já pago, cada um pelo seu ramo (D16)', async () => {
    const ctx = setup();
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({ id: 'e-pending', amountCents: 10_000 }),
    );
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-paid',
        amountCents: 5_000,
        payments: [
          {
            id: 'p-paid',
            amountCents: 5_000,
            paidAt: new Date('2026-07-01T00:00:00.000Z'),
            paymentMethod: 'pix',
            cardBrand: null,
          },
        ],
      }),
    );
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 15_000,
    });

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      financialEntryIds: ['e-pending', 'e-paid'],
    });

    expect(result.matches).toHaveLength(2);
    const pendingEntry = await ctx.financialEntryRepository.findById(
      ORGANIZATION_ID,
      'e-pending',
    );
    expect(pendingEntry!.payments[0].paymentMethod).toBe(
      'conciliacao_bancaria',
    );
    const paidEntry = await ctx.financialEntryRepository.findById(
      ORGANIZATION_ID,
      'e-paid',
    );
    expect(paidEntry!.payments).toHaveLength(1);
    expect(paidEntry!.payments[0].paymentMethod).toBe('pix');
  });

  it('rejeita extrato de outra organização', async () => {
    const ctx = setup();
    const { transaction } = await seedStatementAndTransaction(ctx, {
      amountCents: 15_000,
    });

    await expect(
      ctx.useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: transaction.id,
        financialEntryIds: [],
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
      amountCents: 15_000,
    });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: statement.id,
        transactionId: transaction.id,
        financialEntryIds: [],
      }),
    ).rejects.toBeInstanceOf(BankStatementTransactionNotFoundError);
  });
});
