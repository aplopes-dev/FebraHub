import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type {
  IndicacoesPeriodMode,
  IndicacoesReferrerRow,
} from '../../../domain/indicacoes.types';
import { IndicacoesRepository } from '../../../domain/repositories/indicacoes.repository';
import { resolveIndicacoesPeriodRange } from '../../../domain/utils/resolve-indicacoes-period';

export type ListIndicacoesReferrersInput = {
  storeId: string;
  periodMode: IndicacoesPeriodMode;
  year: number;
  month?: number;
  page?: number;
  perPage?: number;
  sortBy?: 'totalReferrals' | 'approvedBudgetsCount';
  sortOrder?: 'asc' | 'desc';
};

export type ListIndicacoesReferrersOutput = {
  items: IndicacoesReferrerRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListIndicacoesReferrersUseCase
  implements
    IUseCase<ListIndicacoesReferrersInput, ListIndicacoesReferrersOutput>
{
  constructor(private readonly indicacoesRepository: IndicacoesRepository) {}

  async execute(
    input: ListIndicacoesReferrersInput,
  ): Promise<ListIndicacoesReferrersOutput> {
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

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const sortBy = input.sortBy ?? 'totalReferrals';
    const sortOrder = input.sortOrder ?? 'desc';
    const skip = (page - 1) * perPage;

    const result = await this.indicacoesRepository.listReferrers(input.storeId, {
      startDate: range.startDate,
      endDate: range.endDate,
      skip,
      take: perPage,
      sortBy,
      sortOrder,
    });

    return {
      items: result.items,
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage) || 0,
    };
  }
}
