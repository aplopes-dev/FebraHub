import {
  makeFinancialEntry,
  makeFinancialEntryRepositories,
} from '../../../../financial-entries/tests/financial-entries-test-factory';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  BANK_STATEMENT_ID,
  BANK_ACCOUNT_ID,
  OTHER_BANK_ACCOUNT_ID,
  makeBankStatement,
  makeBankStatementTransaction,
  makeBankStatementMatch,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { SearchEligibleEntriesUseCase } from './search-eligible-entries.use-case';

function setup() {
  const { financialEntryRepository } = makeFinancialEntryRepositories();
  const {
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
  } = makeBankReconciliationRepositories();

  const useCase = new SearchEligibleEntriesUseCase(
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

async function seedStatementAndTransaction(ctx: ReturnType<typeof setup>) {
  const statement = makeBankStatement();
  await ctx.bankStatementRepository.save(statement);
  const transaction = makeBankStatementTransaction();
  await ctx.bankStatementTransactionRepository.saveMany([transaction]);
  return { statement, transaction };
}

describe('SearchEligibleEntriesUseCase', () => {
  it('retorna lançamentos `pending` e `paid` da conta do extrato (D16/D17)', async () => {
    const ctx = setup();
    const { transaction } = await seedStatementAndTransaction(ctx);
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-pending',
        bankAccountId: BANK_ACCOUNT_ID,
        description: 'Pendente',
      }),
    );
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-paid',
        bankAccountId: BANK_ACCOUNT_ID,
        description: 'Já pago',
        amountCents: 5_000,
        payments: [
          {
            id: 'p0',
            amountCents: 5_000,
            paidAt: new Date('2026-08-05T00:00:00.000Z'),
            paymentMethod: 'pix',
            cardBrand: null,
          },
        ],
      }),
    );

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      page: 1,
      perPage: 20,
    });

    const ids = result.data.map((item) => item.financialEntryId).sort();
    expect(ids).toEqual(['e-paid', 'e-pending']);
    const paid = result.data.find((item) => item.financialEntryId === 'e-paid');
    expect(paid!.eligibleAmountCents).toBe(5_000);
    expect(paid!.status).toBe('paid');
  });

  it('exclui lançamento já vinculado a uma conciliação ativa com outra transação (FR-033)', async () => {
    const ctx = setup();
    const { transaction } = await seedStatementAndTransaction(ctx);
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-vinculado',
        bankAccountId: BANK_ACCOUNT_ID,
        amountCents: 5_000,
        payments: [
          {
            id: 'p0',
            amountCents: 5_000,
            paidAt: new Date('2026-08-05T00:00:00.000Z'),
            paymentMethod: 'pix',
            cardBrand: null,
          },
        ],
      }),
    );
    await ctx.bankStatementMatchRepository.saveMany([
      makeBankStatementMatch({
        id: 'match-1',
        bankStatementTransactionId: 'outra-transacao',
        financialEntryId: 'e-vinculado',
        financialEntryPaymentId: 'p0',
      }),
    ]);

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      page: 1,
      perPage: 20,
    });

    expect(result.data).toHaveLength(0);
  });

  it('restringe à conta do extrato, ignorando lançamentos de outra conta (FR-037)', async () => {
    const ctx = setup();
    const { transaction } = await seedStatementAndTransaction(ctx);
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-outra-conta',
        bankAccountId: OTHER_BANK_ACCOUNT_ID,
      }),
    );

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      page: 1,
      perPage: 20,
    });

    expect(result.data).toHaveLength(0);
  });

  it('filtra por categoria (chartOfAccountId)', async () => {
    const ctx = setup();
    const { transaction } = await seedStatementAndTransaction(ctx);
    const CATEGORY_ID = 'a1111111-1111-4111-8111-111111111111';
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-categoria',
        bankAccountId: BANK_ACCOUNT_ID,
        allocations: [
          {
            chartOfAccountId: CATEGORY_ID,
            costCenterId: 'f1111111-1111-4111-8111-111111111111',
            amountCents: 10_000,
            percentage: 100,
          },
        ],
      }),
    );
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-outra-categoria',
        bankAccountId: BANK_ACCOUNT_ID,
      }),
    );

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      chartOfAccountId: CATEGORY_ID,
      page: 1,
      perPage: 20,
    });

    expect(result.data.map((item) => item.financialEntryId)).toEqual([
      'e-categoria',
    ]);
  });

  it('filtra por método de pagamento e bandeira (FR-038)', async () => {
    const ctx = setup();
    const { transaction } = await seedStatementAndTransaction(ctx);
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-credito',
        bankAccountId: BANK_ACCOUNT_ID,
        amountCents: 5_000,
        payments: [
          {
            id: 'p0',
            amountCents: 5_000,
            paidAt: new Date('2026-08-05T00:00:00.000Z'),
            paymentMethod: 'credito',
            cardBrand: 'visa',
          },
        ],
      }),
    );
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-pix',
        bankAccountId: BANK_ACCOUNT_ID,
        amountCents: 5_000,
        payments: [
          {
            id: 'p1',
            amountCents: 5_000,
            paidAt: new Date('2026-08-05T00:00:00.000Z'),
            paymentMethod: 'pix',
            cardBrand: null,
          },
        ],
      }),
    );

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      paymentMethod: 'credito',
      cardBrand: 'visa',
      page: 1,
      perPage: 20,
    });

    expect(result.data.map((item) => item.financialEntryId)).toEqual([
      'e-credito',
    ]);
  });

  it('filtra por período de recebimento/pagamento (periodType=paid)', async () => {
    const ctx = setup();
    const { transaction } = await seedStatementAndTransaction(ctx);
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-pago-julho',
        bankAccountId: BANK_ACCOUNT_ID,
        amountCents: 5_000,
        payments: [
          {
            id: 'p0',
            amountCents: 5_000,
            paidAt: new Date('2026-07-15T00:00:00.000Z'),
            paymentMethod: 'pix',
            cardBrand: null,
          },
        ],
      }),
    );
    await ctx.financialEntryRepository.save(
      makeFinancialEntry({
        id: 'e-pago-agosto',
        bankAccountId: BANK_ACCOUNT_ID,
        amountCents: 5_000,
        payments: [
          {
            id: 'p1',
            amountCents: 5_000,
            paidAt: new Date('2026-08-15T00:00:00.000Z'),
            paymentMethod: 'pix',
            cardBrand: null,
          },
        ],
      }),
    );

    const result = await ctx.useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: BANK_STATEMENT_ID,
      transactionId: transaction.id,
      periodFrom: new Date('2026-08-01T00:00:00.000Z'),
      periodTo: new Date('2026-08-31T00:00:00.000Z'),
      periodType: ['paid'],
      page: 1,
      perPage: 20,
    });

    expect(result.data.map((item) => item.financialEntryId)).toEqual([
      'e-pago-agosto',
    ]);
  });

  it('rejeita extrato de outra organização', async () => {
    const ctx = setup();
    const { transaction } = await seedStatementAndTransaction(ctx);

    await expect(
      ctx.useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        bankStatementId: BANK_STATEMENT_ID,
        transactionId: transaction.id,
        page: 1,
        perPage: 20,
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
    });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(
      ctx.useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: statement.id,
        transactionId: transaction.id,
        page: 1,
        perPage: 20,
      }),
    ).rejects.toBeInstanceOf(BankStatementTransactionNotFoundError);
  });
});
