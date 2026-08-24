import { CreateFinancialEntryUseCase } from './create-financial-entry.use-case';
import { BankAccountNotFoundError } from '../../../../bank-accounts/domain/errors/bank-account-not-found.error';
import { ChartOfAccountNotFoundError } from '../../../../chart-of-accounts/domain/errors/chart-of-account-not-found.error';
import { CostCenterNotFoundError } from '../../../../cost-centers/domain/errors/cost-center-not-found.error';
import { CustomerNotFoundError } from '../../../../../customers/domain/errors/customer-not-found.error';
import { SupplierNotFoundError } from '../../../../../stock/suppliers/domain/errors/supplier-not-found.error';
import { AllocationMismatchError } from '../../../domain/errors/allocation-mismatch.error';
import { FinancialEntryPartyConflictError } from '../../../domain/errors/financial-entry-party-conflict.error';
import {
  BANK_ACCOUNT_ID,
  makeBankAccount,
} from '../../../../bank-accounts/tests/bank-accounts-test-factory';
import {
  CHART_OF_ACCOUNT_ID,
  makeChartOfAccount,
} from '../../../../chart-of-accounts/tests/chart-of-accounts-test-factory';
import { FINANCIAL_GROUP_ID } from '../../../../financial-groups/tests/financial-groups-test-factory';
import { makeFinancialGroup } from '../../../../financial-groups/tests/financial-groups-test-factory';
import {
  COST_CENTER_ID,
  makeCostCenter,
} from '../../../../cost-centers/tests/cost-centers-test-factory';
import {
  CUSTOMER_ID,
  makeCustomer,
} from '../../../../../customers/tests/customers-test-factory';
import {
  SUPPLIER_ID,
  makeSupplier,
} from '../../../../../stock/suppliers/tests/suppliers-test-factory';
import {
  COMPETENCE_DATE,
  DUE_DATE,
  makeFinancialEntryAllocation,
  makeFinancialEntryPayment,
  makeFinancialEntryRepositories,
  ORGANIZATION_ID,
} from '../../../tests/financial-entries-test-factory';

describe('CreateFinancialEntryUseCase', () => {
  async function setup() {
    const repos = makeFinancialEntryRepositories();
    // A conta do plano de contas depende de um grupo financeiro válido.
    await repos.financialGroupRepository.save(
      makeFinancialGroup({ id: FINANCIAL_GROUP_ID }),
    );
    await repos.chartOfAccountRepository.save(
      makeChartOfAccount({ id: CHART_OF_ACCOUNT_ID }),
    );
    await repos.costCenterRepository.save(
      makeCostCenter({ id: COST_CENTER_ID }),
    );

    const useCase = new CreateFinancialEntryUseCase(
      repos.financialEntryRepository,
      repos.bankAccountRepository,
      repos.chartOfAccountRepository,
      repos.costCenterRepository,
      repos.paymentMethodRepository,
      repos.customerRepository,
      repos.supplierRepository,
    );
    return { ...repos, useCase };
  }

  const validAllocation = () =>
    makeFinancialEntryAllocation({
      chartOfAccountId: CHART_OF_ACCOUNT_ID,
      costCenterId: COST_CENTER_ID,
      amountCents: 10_000,
      percentage: 100,
    });

  const baseInput = {
    organizationId: ORGANIZATION_ID,
    operation: 'receivable' as const,
    amountCents: 10_000,
    competenceDate: COMPETENCE_DATE,
    dueDate: DUE_DATE,
  };

  it('cria o lançamento com os textos aparados e os opcionais em branco', async () => {
    const { useCase } = await setup();

    const entry = await useCase.execute({
      ...baseInput,
      description: '  Venda balcão  ',
      partyName: '  Maria Silva  ',
      allocations: [validAllocation()],
    });

    expect(entry.description).toBe('Venda balcão');
    expect(entry.partyName).toBe('Maria Silva');
    expect(entry.paidCents).toBe(0);
    expect(entry.status).toBe('pending');
    expect(entry.feesCents).toBe(0);
    expect(entry.finesCents).toBe(0);
    expect(entry.totalCents).toBe(10_000);
    expect(entry.categoryName).toBe('');
    expect(entry.note).toBe('');
    expect(entry.customerId).toBeNull();
    expect(entry.supplierId).toBeNull();
    expect(entry.bankAccountId).toBeNull();
    expect(entry.saleOrderId).toBeNull();
    expect(entry.deletedAt).toBeNull();
    expect(entry.allocations).toHaveLength(1);
  });

  it('calcula o total como valor + taxa + multa e deriva o status a partir dos pagamentos', async () => {
    const { useCase } = await setup();

    const entry = await useCase.execute({
      ...baseInput,
      feesCents: 500,
      finesCents: 200,
      payments: [makeFinancialEntryPayment({ amountCents: 10_700 })],
      allocations: [
        makeFinancialEntryAllocation({
          chartOfAccountId: CHART_OF_ACCOUNT_ID,
          costCenterId: COST_CENTER_ID,
          amountCents: 10_700,
          percentage: 100,
        }),
      ],
    });

    expect(entry.totalCents).toBe(10_700);
    expect(entry.paidCents).toBe(10_700);
    expect(entry.status).toBe('paid');
    expect(entry.payments).toHaveLength(1);
  });

  it('aceita a conta bancária ativa informada', async () => {
    const { useCase, bankAccountRepository } = await setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));

    const entry = await useCase.execute({
      ...baseInput,
      bankAccountId: BANK_ACCOUNT_ID,
      allocations: [validAllocation()],
    });

    expect(entry.bankAccountId).toBe(BANK_ACCOUNT_ID);
  });

  it('recusa conta bancária inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        bankAccountId: BANK_ACCOUNT_ID,
        allocations: [validAllocation()],
      }),
    ).rejects.toBeInstanceOf(BankAccountNotFoundError);
  });

  it('recusa conta bancária excluída', async () => {
    const { useCase, bankAccountRepository } = await setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));
    await bankAccountRepository.softDelete(
      ORGANIZATION_ID,
      BANK_ACCOUNT_ID,
      new Date(),
    );

    await expect(
      useCase.execute({
        ...baseInput,
        bankAccountId: BANK_ACCOUNT_ID,
        allocations: [validAllocation()],
      }),
    ).rejects.toBeInstanceOf(BankAccountNotFoundError);
  });

  it('aceita cliente ativo informado', async () => {
    const { useCase, customerRepository } = await setup();
    await customerRepository.save(makeCustomer({ id: CUSTOMER_ID }));

    const entry = await useCase.execute({
      ...baseInput,
      customerId: CUSTOMER_ID,
      allocations: [validAllocation()],
    });

    expect(entry.customerId).toBe(CUSTOMER_ID);
  });

  it('recusa cliente inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        customerId: CUSTOMER_ID,
        allocations: [validAllocation()],
      }),
    ).rejects.toBeInstanceOf(CustomerNotFoundError);
  });

  it('aceita fornecedor ativo informado', async () => {
    const { useCase, supplierRepository } = await setup();
    await supplierRepository.save(makeSupplier({ id: SUPPLIER_ID }));

    const entry = await useCase.execute({
      ...baseInput,
      operation: 'payable',
      supplierId: SUPPLIER_ID,
      allocations: [validAllocation()],
    });

    expect(entry.supplierId).toBe(SUPPLIER_ID);
  });

  it('recusa fornecedor inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        supplierId: SUPPLIER_ID,
        allocations: [validAllocation()],
      }),
    ).rejects.toBeInstanceOf(SupplierNotFoundError);
  });

  it('recusa cliente e fornecedor preenchidos ao mesmo tempo', async () => {
    const { useCase, customerRepository, supplierRepository } = await setup();
    await customerRepository.save(makeCustomer({ id: CUSTOMER_ID }));
    await supplierRepository.save(makeSupplier({ id: SUPPLIER_ID }));

    await expect(
      useCase.execute({
        ...baseInput,
        customerId: CUSTOMER_ID,
        supplierId: SUPPLIER_ID,
        allocations: [validAllocation()],
      }),
    ).rejects.toBeInstanceOf(FinancialEntryPartyConflictError);
  });

  it('recusa categoria financeira inexistente na organização', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        allocations: [
          makeFinancialEntryAllocation({
            chartOfAccountId: 'c9999999-9999-4999-8999-999999999999',
            costCenterId: COST_CENTER_ID,
            amountCents: 10_000,
            percentage: 100,
          }),
        ],
      }),
    ).rejects.toBeInstanceOf(ChartOfAccountNotFoundError);
  });

  it('recusa centro de custo inexistente na organização', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        allocations: [
          makeFinancialEntryAllocation({
            chartOfAccountId: CHART_OF_ACCOUNT_ID,
            costCenterId: 'c9999999-9999-4999-8999-999999999999',
            amountCents: 10_000,
            percentage: 100,
          }),
        ],
      }),
    ).rejects.toBeInstanceOf(CostCenterNotFoundError);
  });

  it('recusa rateio vazio quando o total é maior que zero', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ ...baseInput, allocations: [] }),
    ).rejects.toBeInstanceOf(AllocationMismatchError);
  });

  it('recusa rateio cuja soma diverge do total além da tolerância de 1 centavo', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        allocations: [
          makeFinancialEntryAllocation({
            chartOfAccountId: CHART_OF_ACCOUNT_ID,
            costCenterId: COST_CENTER_ID,
            amountCents: 9_000,
            percentage: 90,
          }),
        ],
      }),
    ).rejects.toBeInstanceOf(AllocationMismatchError);
  });

  it('aceita rateio dentro da tolerância de 1 centavo', async () => {
    const { useCase } = await setup();

    const entry = await useCase.execute({
      ...baseInput,
      allocations: [
        makeFinancialEntryAllocation({
          chartOfAccountId: CHART_OF_ACCOUNT_ID,
          costCenterId: COST_CENTER_ID,
          amountCents: 9_999,
          percentage: 100,
        }),
      ],
    });

    expect(entry.allocations[0]?.amountCents).toBe(9_999);
  });

  it('gera 1 movimentação credit por pagamento quando há conta bancária (receivable — RN-12/FR-016)', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      await setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));

    const entry = await useCase.execute({
      ...baseInput,
      bankAccountId: BANK_ACCOUNT_ID,
      amountCents: 10_000,
      payments: [makeFinancialEntryPayment({ amountCents: 10_000 })],
      allocations: [validAllocation()],
    });

    const movements = await bankTransactionRepository.findByAccount(
      ORGANIZATION_ID,
      BANK_ACCOUNT_ID,
      {},
    );
    expect(movements).toHaveLength(1);
    expect(movements[0].kind).toBe('credit');
    expect(movements[0].amountCents).toBe(10_000);
    expect(movements[0].sourceType).toBe('financial_entry_payment');
    expect(movements[0].sourceId).toBe(entry.id);
  });

  it('gera movimentação debit para um payable', async () => {
    const { useCase, bankAccountRepository, bankTransactionRepository } =
      await setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));

    await useCase.execute({
      ...baseInput,
      operation: 'payable',
      bankAccountId: BANK_ACCOUNT_ID,
      amountCents: 10_000,
      payments: [makeFinancialEntryPayment({ amountCents: 10_000 })],
      allocations: [validAllocation()],
    });

    const movements = await bankTransactionRepository.findByAccount(
      ORGANIZATION_ID,
      BANK_ACCOUNT_ID,
      {},
    );
    expect(movements[0].kind).toBe('debit');
  });

  it('não gera nenhuma movimentação quando o lançamento não tem conta bancária', async () => {
    const { useCase, bankTransactionRepository } = await setup();

    const entry = await useCase.execute({
      ...baseInput,
      payments: [makeFinancialEntryPayment({ amountCents: 10_000 })],
      allocations: [validAllocation()],
    });

    const balances = await bankTransactionRepository.sumBalancesByAccountIds(
      ORGANIZATION_ID,
      [entry.id],
    );
    expect(balances).toEqual({});
  });
});
