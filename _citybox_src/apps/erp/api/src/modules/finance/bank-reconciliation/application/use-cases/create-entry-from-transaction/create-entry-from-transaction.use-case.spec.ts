import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  BANK_STATEMENT_ID,
  BANK_STATEMENT_TRANSACTION_ID,
  BANK_ACCOUNT_ID,
  makeBankStatement,
  makeBankStatementTransaction,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import {
  makeFinancialEntryRepositories,
  makeChartOfAccount,
  makeCostCenter,
} from '../../../../financial-entries/tests/financial-entries-test-factory';
import { makeCustomer } from '../../../../../customers/tests/customers-test-factory';
import { makeSupplier } from '../../../../../stock/suppliers/tests/suppliers-test-factory';
import { FinancialEntryPartyConflictError } from '../../../../financial-entries/domain/errors/financial-entry-party-conflict.error';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { BankStatementTransactionNotPendingError } from '../../../domain/errors/bank-statement-transaction-not-pending.error';
import { ChartOfAccountNotFoundError } from '../../../../chart-of-accounts/domain/errors/chart-of-account-not-found.error';
import { CostCenterNotFoundError } from '../../../../cost-centers/domain/errors/cost-center-not-found.error';
import { BankAccountNotFoundError } from '../../../../bank-accounts/domain/errors/bank-account-not-found.error';
import { makeBankAccount } from '../../../../bank-accounts/tests/bank-accounts-test-factory';
import { CreateEntryFromTransactionUseCase } from './create-entry-from-transaction.use-case';

const CHART_OF_ACCOUNT_ID = 'a1111111-1111-4111-8111-111111111111';
const COST_CENTER_ID = 'f1111111-1111-4111-8111-111111111111';
const OTHER_BANK_ACCOUNT_ID = 'b2222222-2222-4222-8222-222222222222';

function setup() {
  const {
    financialEntryRepository,
    chartOfAccountRepository,
    costCenterRepository,
    bankAccountRepository,
    customerRepository,
    supplierRepository,
  } = makeFinancialEntryRepositories();
  const {
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
  } = makeBankReconciliationRepositories();

  const useCase = new CreateEntryFromTransactionUseCase(
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
    financialEntryRepository,
    chartOfAccountRepository,
    costCenterRepository,
    bankAccountRepository,
    customerRepository,
    supplierRepository,
  );

  return {
    financialEntryRepository,
    chartOfAccountRepository,
    costCenterRepository,
    bankAccountRepository,
    customerRepository,
    supplierRepository,
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankStatementMatchRepository,
    useCase,
  };
}

async function seedBase(ctx: ReturnType<typeof setup>) {
  await ctx.chartOfAccountRepository.save(
    makeChartOfAccount({ id: CHART_OF_ACCOUNT_ID }),
  );
  await ctx.costCenterRepository.save(makeCostCenter({ id: COST_CENTER_ID }));
  await ctx.bankAccountRepository.save(
    makeBankAccount({ id: BANK_ACCOUNT_ID }),
  );
  const statement = makeBankStatement({ bankAccountId: BANK_ACCOUNT_ID });
  await ctx.bankStatementRepository.save(statement);
  const transaction = makeBankStatementTransaction({
    amountCents: 12_345,
    kind: 'credit',
  });
  await ctx.bankStatementTransactionRepository.saveMany([transaction]);
  return { statement, transaction };
}

function baseInput() {
  return {
    organizationId: ORGANIZATION_ID,
    bankStatementId: BANK_STATEMENT_ID,
    transactionId: BANK_STATEMENT_TRANSACTION_ID,
    description: 'TED RECEBIDA - JOAO SILVA',
    partyName: '',
    customerId: null,
    supplierId: null,
    categoryName: '',
    note: '',
    bankAccountId: BANK_ACCOUNT_ID,
    chartOfAccountId: CHART_OF_ACCOUNT_ID,
    costCenterId: COST_CENTER_ID,
  };
}

describe('CreateEntryFromTransactionUseCase', () => {
  it('cria o lançamento já pago e concilia a transação numa só operação', async () => {
    const ctx = setup();
    await seedBase(ctx);

    const result = await ctx.useCase.execute(baseInput());

    expect(result.financialEntry.operation).toBe('receivable');
    expect(result.financialEntry.amountCents).toBe(12_345);
    expect(result.financialEntry.status).toBe('paid');
    expect(result.financialEntry.payments).toHaveLength(1);
    expect(result.financialEntry.payments[0].paymentMethod).toBe(
      'conciliacao_bancaria',
    );
    expect(result.transaction.status).toBe('reconciled');
    expect(result.match.financialEntryId).toBe(result.financialEntry.id);
    expect(result.bankStatement.reconciledCount).toBe(1);

    const persistedMatches =
      await ctx.bankStatementMatchRepository.findByTransactionId(
        ORGANIZATION_ID,
        BANK_STATEMENT_TRANSACTION_ID,
      );
    expect(persistedMatches).toHaveLength(1);
  });

  it('deriva operation=payable de uma transação de débito', async () => {
    const ctx = setup();
    await ctx.chartOfAccountRepository.save(
      makeChartOfAccount({ id: CHART_OF_ACCOUNT_ID }),
    );
    await ctx.costCenterRepository.save(makeCostCenter({ id: COST_CENTER_ID }));
    await ctx.bankAccountRepository.save(
      makeBankAccount({ id: BANK_ACCOUNT_ID }),
    );
    const statement = makeBankStatement({ bankAccountId: BANK_ACCOUNT_ID });
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({
      amountCents: 5_000,
      kind: 'debit',
    });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    const result = await ctx.useCase.execute(baseInput());

    expect(result.financialEntry.operation).toBe('payable');
  });

  it('usa a conta bancária informada no corpo, mesmo diferente da conta do extrato (D14)', async () => {
    const ctx = setup();
    await seedBase(ctx);
    await ctx.bankAccountRepository.save(
      makeBankAccount({ id: OTHER_BANK_ACCOUNT_ID }),
    );

    const result = await ctx.useCase.execute({
      ...baseInput(),
      bankAccountId: OTHER_BANK_ACCOUNT_ID,
    });

    expect(result.financialEntry.bankAccountId).toBe(OTHER_BANK_ACCOUNT_ID);
  });

  it('rejeita bankAccountId inexistente', async () => {
    const ctx = setup();
    await ctx.chartOfAccountRepository.save(
      makeChartOfAccount({ id: CHART_OF_ACCOUNT_ID }),
    );
    await ctx.costCenterRepository.save(makeCostCenter({ id: COST_CENTER_ID }));
    const statement = makeBankStatement({ bankAccountId: BANK_ACCOUNT_ID });
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({ amountCents: 12_345 });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(ctx.useCase.execute(baseInput())).rejects.toBeInstanceOf(
      BankAccountNotFoundError,
    );
  });

  it('rejeita quando a transação não está pendente', async () => {
    const ctx = setup();
    await ctx.chartOfAccountRepository.save(
      makeChartOfAccount({ id: CHART_OF_ACCOUNT_ID }),
    );
    await ctx.costCenterRepository.save(makeCostCenter({ id: COST_CENTER_ID }));
    const statement = makeBankStatement({ bankAccountId: BANK_ACCOUNT_ID });
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({
      amountCents: 12_345,
      status: 'reconciled',
    });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(ctx.useCase.execute(baseInput())).rejects.toBeInstanceOf(
      BankStatementTransactionNotPendingError,
    );
  });

  it('rejeita chartOfAccountId inexistente', async () => {
    const ctx = setup();
    await ctx.costCenterRepository.save(makeCostCenter({ id: COST_CENTER_ID }));
    const statement = makeBankStatement({ bankAccountId: BANK_ACCOUNT_ID });
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({ amountCents: 12_345 });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(ctx.useCase.execute(baseInput())).rejects.toBeInstanceOf(
      ChartOfAccountNotFoundError,
    );
  });

  it('rejeita costCenterId inexistente', async () => {
    const ctx = setup();
    await ctx.chartOfAccountRepository.save(
      makeChartOfAccount({ id: CHART_OF_ACCOUNT_ID }),
    );
    const statement = makeBankStatement({ bankAccountId: BANK_ACCOUNT_ID });
    await ctx.bankStatementRepository.save(statement);
    const transaction = makeBankStatementTransaction({ amountCents: 12_345 });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(ctx.useCase.execute(baseInput())).rejects.toBeInstanceOf(
      CostCenterNotFoundError,
    );
  });

  it('rejeita extrato de outra organização', async () => {
    const ctx = setup();
    await seedBase(ctx);

    await expect(
      ctx.useCase.execute({
        ...baseInput(),
        organizationId: OTHER_ORGANIZATION_ID,
      }),
    ).rejects.toBeInstanceOf(BankStatementNotFoundError);
  });

  it('rejeita transação que não pertence ao extrato informado', async () => {
    const ctx = setup();
    await ctx.chartOfAccountRepository.save(
      makeChartOfAccount({ id: CHART_OF_ACCOUNT_ID }),
    );
    await ctx.costCenterRepository.save(makeCostCenter({ id: COST_CENTER_ID }));
    const statement = makeBankStatement({ bankAccountId: BANK_ACCOUNT_ID });
    await ctx.bankStatementRepository.save(statement);
    const otherStatement = makeBankStatement({ id: 'other-statement' });
    await ctx.bankStatementRepository.save(otherStatement);
    const transaction = makeBankStatementTransaction({
      bankStatementId: otherStatement.id,
      amountCents: 12_345,
    });
    await ctx.bankStatementTransactionRepository.saveMany([transaction]);

    await expect(ctx.useCase.execute(baseInput())).rejects.toBeInstanceOf(
      BankStatementTransactionNotFoundError,
    );
  });

  // Spec erp/031 D2 — campo Cliente/Fornecedor da Conciliação bancária vira
  // lista real, com vínculo gravado (não só texto livre).
  it('grava customerId quando informado', async () => {
    const ctx = setup();
    await seedBase(ctx);
    const customer = makeCustomer();
    await ctx.customerRepository.save(customer);

    const result = await ctx.useCase.execute({
      ...baseInput(),
      customerId: customer.id,
    });

    expect(result.financialEntry.customerId).toBe(customer.id);
    expect(result.financialEntry.supplierId).toBeNull();
  });

  it('grava supplierId quando informado', async () => {
    const ctx = setup();
    await seedBase(ctx);
    const supplier = makeSupplier();
    await ctx.supplierRepository.save(supplier);

    const result = await ctx.useCase.execute({
      ...baseInput(),
      supplierId: supplier.id,
    });

    expect(result.financialEntry.supplierId).toBe(supplier.id);
    expect(result.financialEntry.customerId).toBeNull();
  });

  it('rejeita customerId e supplierId preenchidos ao mesmo tempo', async () => {
    const ctx = setup();
    await seedBase(ctx);
    const customer = makeCustomer();
    const supplier = makeSupplier();
    await ctx.customerRepository.save(customer);
    await ctx.supplierRepository.save(supplier);

    await expect(
      ctx.useCase.execute({
        ...baseInput(),
        customerId: customer.id,
        supplierId: supplier.id,
      }),
    ).rejects.toBeInstanceOf(FinancialEntryPartyConflictError);
  });

  it('salva sem cliente/fornecedor vinculado quando nenhum é informado', async () => {
    const ctx = setup();
    await seedBase(ctx);

    const result = await ctx.useCase.execute(baseInput());

    expect(result.financialEntry.customerId).toBeNull();
    expect(result.financialEntry.supplierId).toBeNull();
  });
});
