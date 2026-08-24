import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { assertValidPeriodRange } from '../../../domain/validators/period-range.validator';
import type {
  FinancialEntriesSummaryDto,
  GetFinancialEntriesSummaryInput,
} from '../../dtos/financial-entries-summary.dto';

/**
 * Cards de resumo do extrato (entradas/saídas/saldo) — soma `amountCents`
 * agrupado por `operation` sobre o mesmo conjunto de filtros da listagem
 * (`FinancialEntryFilterQueryDto`), sempre via `groupBy` no banco
 * (`sumAmountsByOperation`). Nunca considera lançamentos excluídos (aba
 * `active` implícita — nenhum campo `tab` é aceito aqui) — FR-012.
 */
@Injectable()
export class GetFinancialEntriesSummaryUseCase implements IUseCase<
  GetFinancialEntriesSummaryInput,
  FinancialEntriesSummaryDto
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    input: GetFinancialEntriesSummaryInput,
  ): Promise<FinancialEntriesSummaryDto> {
    assertValidPeriodRange(input.dueFrom, input.dueTo);
    assertValidPeriodRange(input.competenceFrom, input.competenceTo);

    const groups = await this.financialEntryRepository.sumAmountsByOperation(
      input.organizationId,
      {
        operation: input.operation,
        status: input.status,
        chartOfAccountId: input.chartOfAccountId,
        costCenterId: input.costCenterId,
        bankAccountId: input.bankAccountId,
        search: input.search,
        dueFrom: input.dueFrom,
        dueTo: input.dueTo,
        competenceFrom: input.competenceFrom,
        competenceTo: input.competenceTo,
      },
    );

    const receivableCents =
      groups.find((group) => group.operation === 'receivable')?.totalCents ?? 0;
    const payableCents =
      groups.find((group) => group.operation === 'payable')?.totalCents ?? 0;

    return {
      receivableCents,
      payableCents,
      netCents: receivableCents - payableCents,
    };
  }
}
