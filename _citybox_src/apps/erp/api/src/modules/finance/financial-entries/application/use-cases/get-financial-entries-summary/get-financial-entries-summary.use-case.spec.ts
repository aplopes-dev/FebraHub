import { GetFinancialEntriesSummaryUseCase } from './get-financial-entries-summary.use-case';
import { InvalidStatementPeriodError } from '../../../domain/errors/invalid-statement-period.error';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  makeFinancialEntry,
  makeFinancialEntryAllocation,
  makeFinancialEntryRepositories,
} from '../../../tests/financial-entries-test-factory';
import { BANK_ACCOUNT_ID } from '../../../../bank-accounts/tests/bank-accounts-test-factory';

const RECEIVABLE_ID = 'e1111111-1111-4111-8111-111111111111';
const PAYABLE_ID = 'e2222222-2222-4222-8222-222222222222';
const DELETED_ID = 'e3333333-3333-4333-8333-333333333333';
const RATEADO_ID = 'e4444444-4444-4444-8444-444444444444';
const BANK_ACCOUNT_ONLY_ID = 'e5555555-5555-4555-8555-555555555555';

const CHART_OF_ACCOUNT_A = 'a1111111-1111-4111-8111-111111111111';
const CHART_OF_ACCOUNT_B = 'a2222222-2222-4222-8222-222222222222';
const COST_CENTER_ID = 'f1111111-1111-4111-8111-111111111111';

describe('GetFinancialEntriesSummaryUseCase', () => {
  async function setup() {
    const repos = makeFinancialEntryRepositories();
    const useCase = new GetFinancialEntriesSummaryUseCase(
      repos.financialEntryRepository,
    );

    await repos.financialEntryRepository.save(
      makeFinancialEntry({
        id: RECEIVABLE_ID,
        operation: 'receivable',
        amountCents: 15_000_00,
      }),
    );
    await repos.financialEntryRepository.save(
      makeFinancialEntry({
        id: PAYABLE_ID,
        operation: 'payable',
        amountCents: 4_000_00,
      }),
    );
    await repos.financialEntryRepository.save(
      makeFinancialEntry({ id: DELETED_ID, operation: 'payable' }),
    );
    await repos.financialEntryRepository.softDelete(
      ORGANIZATION_ID,
      DELETED_ID,
      new Date(),
    );

    return { ...repos, useCase };
  }

  it('soma amountCents por operação, com netCents = receivable - payable', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result).toEqual({
      receivableCents: 15_000_00,
      payableCents: 4_000_00,
      netCents: 11_000_00,
    });
  });

  it('netCents pode ser negativo quando saídas superam entradas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      operation: 'payable',
    });

    expect(result).toEqual({
      receivableCents: 0,
      payableCents: 4_000_00,
      netCents: -4_000_00,
    });
  });

  it('ignora lançamento soft-deleted', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    // DELETED_ID é payable e não deveria somar aos 4_000_00 de PAYABLE_ID.
    expect(result.payableCents).toBe(4_000_00);
  });

  it('respeita o filtro de conta bancária, sem contar lançamentos de outras contas', async () => {
    const { useCase, financialEntryRepository } = await setup();
    await financialEntryRepository.save(
      makeFinancialEntry({
        id: BANK_ACCOUNT_ONLY_ID,
        operation: 'receivable',
        amountCents: 500_00,
        bankAccountId: BANK_ACCOUNT_ID,
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
    });

    expect(result).toEqual({
      receivableCents: 500_00,
      payableCents: 0,
      netCents: 500_00,
    });
  });

  it('conta o lançamento rateado uma única vez, mesmo com múltiplas linhas de alocação', async () => {
    const { useCase, financialEntryRepository } = await setup();
    await financialEntryRepository.save(
      makeFinancialEntry({
        id: RATEADO_ID,
        operation: 'receivable',
        amountCents: 1_000_00,
        allocations: [
          makeFinancialEntryAllocation({
            chartOfAccountId: CHART_OF_ACCOUNT_A,
            costCenterId: COST_CENTER_ID,
            amountCents: 800_00,
            percentage: 80,
          }),
          makeFinancialEntryAllocation({
            chartOfAccountId: CHART_OF_ACCOUNT_B,
            costCenterId: COST_CENTER_ID,
            amountCents: 200_00,
            percentage: 20,
          }),
        ],
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      chartOfAccountId: [CHART_OF_ACCOUNT_A, CHART_OF_ACCOUNT_B],
    });

    // O filtro bate com o lançamento por CHART_OF_ACCOUNT_A **e** por
    // CHART_OF_ACCOUNT_B (2 linhas de rateio) — a soma continua sendo o
    // `amountCents` do lançamento uma única vez (1_000_00), nunca 800+200
    // somado de novo por cima (o que daria o dobro se a agregação somasse
    // por linha de `allocation` em vez de por `FinancialEntry`).
    expect(result.receivableCents).toBe(1_000_00);
  });

  it('devolve tudo zerado quando o conjunto filtrado não tem nenhum lançamento', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'nada bate com isso aqui',
    });

    expect(result).toEqual({
      receivableCents: 0,
      payableCents: 0,
      netCents: 0,
    });
  });

  it('rejeita vencimento com data final anterior à inicial', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        dueFrom: new Date('2026-09-30T00:00:00.000Z'),
        dueTo: new Date('2026-09-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(InvalidStatementPeriodError);
  });

  it('rejeita competência com data final anterior à inicial', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        competenceFrom: new Date('2026-09-30T00:00:00.000Z'),
        competenceTo: new Date('2026-09-01T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(InvalidStatementPeriodError);
  });

  it('não soma lançamento de outra organização', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: OTHER_ORGANIZATION_ID,
    });

    expect(result).toEqual({
      receivableCents: 0,
      payableCents: 0,
      netCents: 0,
    });
  });
});
