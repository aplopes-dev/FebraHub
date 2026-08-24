import { UpdateFinancialEntryUseCase } from './update-financial-entry.use-case';
import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { AllocationMismatchError } from '../../../domain/errors/allocation-mismatch.error';
import { SaleOrderLinkedEntryForbiddenError } from '../../../domain/errors/sale-order-linked-entry-forbidden.error';
import { ChartOfAccountNotFoundError } from '../../../../chart-of-accounts/domain/errors/chart-of-account-not-found.error';
import {
  CHART_OF_ACCOUNT_ID,
  makeChartOfAccount,
} from '../../../../chart-of-accounts/tests/chart-of-accounts-test-factory';
import {
  FINANCIAL_GROUP_ID,
  makeFinancialGroup,
} from '../../../../financial-groups/tests/financial-groups-test-factory';
import {
  COST_CENTER_ID,
  makeCostCenter,
} from '../../../../cost-centers/tests/cost-centers-test-factory';
import {
  BANK_ACCOUNT_ID,
  makeBankAccount,
} from '../../../../bank-accounts/tests/bank-accounts-test-factory';
import {
  COMPETENCE_DATE,
  DUE_DATE,
  FINANCIAL_ENTRY_ID,
  makeFinancialEntry,
  makeFinancialEntryAllocation,
  makeFinancialEntryPayment,
  makeFinancialEntryRepositories,
  ORGANIZATION_ID,
} from '../../../tests/financial-entries-test-factory';

describe('UpdateFinancialEntryUseCase', () => {
  async function setup() {
    const repos = makeFinancialEntryRepositories();
    await repos.financialGroupRepository.save(
      makeFinancialGroup({ id: FINANCIAL_GROUP_ID }),
    );
    await repos.chartOfAccountRepository.save(
      makeChartOfAccount({ id: CHART_OF_ACCOUNT_ID }),
    );
    await repos.costCenterRepository.save(
      makeCostCenter({ id: COST_CENTER_ID }),
    );

    const useCase = new UpdateFinancialEntryUseCase(
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

  const validAllocation = (amountCents = 10_000, percentage = 100) =>
    makeFinancialEntryAllocation({
      chartOfAccountId: CHART_OF_ACCOUNT_ID,
      costCenterId: COST_CENTER_ID,
      amountCents,
      percentage,
    });

  const baseInput = {
    organizationId: ORGANIZATION_ID,
    id: FINANCIAL_ENTRY_ID,
    operation: 'receivable' as const,
    amountCents: 10_000,
    competenceDate: COMPETENCE_DATE,
    dueDate: DUE_DATE,
  };

  it('atualiza um lançamento existente', async () => {
    const { useCase, financialEntryRepository } = await setup();
    await financialEntryRepository.save(makeFinancialEntry());

    const entry = await useCase.execute({
      ...baseInput,
      description: 'Descrição nova',
      allocations: [validAllocation()],
    });

    expect(entry.description).toBe('Descrição nova');
  });

  it('lança FinancialEntryNotFoundError para lançamento inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ ...baseInput, allocations: [validAllocation()] }),
    ).rejects.toBeInstanceOf(FinancialEntryNotFoundError);
  });

  it('lança FinancialEntryNotFoundError para lançamento já excluído', async () => {
    const { useCase, financialEntryRepository } = await setup();
    await financialEntryRepository.save(makeFinancialEntry());
    await financialEntryRepository.softDelete(
      ORGANIZATION_ID,
      FINANCIAL_ENTRY_ID,
      new Date(),
    );

    await expect(
      useCase.execute({ ...baseInput, allocations: [validAllocation()] }),
    ).rejects.toBeInstanceOf(FinancialEntryNotFoundError);
  });

  it('recusa rateio cuja soma diverge do total', async () => {
    const { useCase, financialEntryRepository } = await setup();
    await financialEntryRepository.save(makeFinancialEntry());

    await expect(
      useCase.execute({
        ...baseInput,
        allocations: [validAllocation(5_000, 50)],
      }),
    ).rejects.toBeInstanceOf(AllocationMismatchError);
  });

  it('recusa categoria financeira inexistente na organização', async () => {
    const { useCase, financialEntryRepository } = await setup();
    await financialEntryRepository.save(makeFinancialEntry());

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

  it('substitui as linhas de pagamento e de rateio por completo', async () => {
    const { useCase, financialEntryRepository } = await setup();
    await financialEntryRepository.save(
      makeFinancialEntry({ allocations: [validAllocation()] }),
    );

    const entry = await useCase.execute({
      ...baseInput,
      allocations: [validAllocation(4_000, 40), validAllocation(6_000, 60)],
    });

    expect(entry.allocations).toHaveLength(2);
  });

  it('recusa editar um lançamento vinculado a um pedido de venda', async () => {
    const { useCase, financialEntryRepository } = await setup();
    // Grava direto via `with()` porque `saleOrderId` não é aceito por `create()`
    // vindo do formulário — só a infra do fechamento de venda o preenche.
    const linked = makeFinancialEntry({ allocations: [validAllocation()] });
    await financialEntryRepository.save(
      FinancialEntry.with(
        { ...linked.props, saleOrderId: 'so-1111-1111-4111-8111-111111111111' },
        linked.id,
      ),
    );

    await expect(
      useCase.execute({ ...baseInput, allocations: [validAllocation()] }),
    ).rejects.toBeInstanceOf(SaleOrderLinkedEntryForbiddenError);
  });

  it('ressincroniza as movimentações de ledger ao editar os pagamentos (RN-12/FR-016)', async () => {
    const {
      useCase,
      financialEntryRepository,
      bankAccountRepository,
      bankTransactionRepository,
    } = await setup();
    await bankAccountRepository.save(makeBankAccount({ id: BANK_ACCOUNT_ID }));
    await financialEntryRepository.save(
      makeFinancialEntry({
        bankAccountId: BANK_ACCOUNT_ID,
        payments: [makeFinancialEntryPayment({ amountCents: 10_000 })],
        allocations: [validAllocation()],
      }),
    );

    await useCase.execute({
      ...baseInput,
      bankAccountId: BANK_ACCOUNT_ID,
      amountCents: 7_000,
      payments: [makeFinancialEntryPayment({ amountCents: 7_000 })],
      allocations: [validAllocation(7_000, 100)],
    });

    const movements = await bankTransactionRepository.findByAccount(
      ORGANIZATION_ID,
      BANK_ACCOUNT_ID,
      {},
    );
    // As movimentações antigas somem, só a nova permanece — nunca duplica.
    expect(movements).toHaveLength(1);
    expect(movements[0].amountCents).toBe(7_000);
  });
});
