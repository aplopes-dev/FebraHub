import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type {
  IndicacoesKpis,
  IndicacoesPeriodMode,
} from '../../../domain/indicacoes.types';
import { IndicacoesRepository } from '../../../domain/repositories/indicacoes.repository';
import { resolveIndicacoesPeriodRange } from '../../../domain/utils/resolve-indicacoes-period';

export type GetIndicacoesKpisInput = {
  storeId: string;
  periodMode: IndicacoesPeriodMode;
  year: number;
  month?: number;
};

@Injectable()
export class GetIndicacoesKpisUseCase
  implements IUseCase<GetIndicacoesKpisInput, IndicacoesKpis>
{
  constructor(private readonly indicacoesRepository: IndicacoesRepository) {}

  async execute(input: GetIndicacoesKpisInput): Promise<IndicacoesKpis> {
    if (input.periodMode === 'monthly' && input.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const range = resolveIndicacoesPeriodRange({
      periodMode: input.periodMode,
      year: input.year,
      month: input.month,
    });

    const [kpis, years] = await Promise.all([
      this.indicacoesRepository.getKpis(input.storeId, {
        startDate: range.startDate,
        endDate: range.endDate,
      }),
      this.indicacoesRepository.listYears(input.storeId),
    ]);

    return {
      ...kpis,
      years,
    };
  }
}
