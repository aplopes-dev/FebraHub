import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import {
  buildExpenseByCategorySummary,
  resolveExpenseByCategoryPeriodRange,
} from '../../utils/dashboard-expense-by-category.math';
import type {
  DashboardExpenseByCategoryPeriodMode,
  DashboardExpenseByCategorySummary,
} from '../../utils/dashboard-expense-by-category.types';

export type GetDashboardExpenseByCategoryDto = {
  storeId: string;
  periodMode: DashboardExpenseByCategoryPeriodMode;
  year: number;
  month?: number;
};

export type GetDashboardExpenseByCategoryResult =
  DashboardExpenseByCategorySummary & {
    years: number[];
  };

@Injectable()
export class GetDashboardExpenseByCategoryUseCase implements IUseCase<
  GetDashboardExpenseByCategoryDto,
  GetDashboardExpenseByCategoryResult
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    dto: GetDashboardExpenseByCategoryDto,
  ): Promise<GetDashboardExpenseByCategoryResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const range = resolveExpenseByCategoryPeriodRange({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const [rows, years] = await Promise.all([
      this.financialEntryRepository.listExpenseByCategoryInRange(dto.storeId, {
        startAt: range.startAt,
        endAt: range.endAt,
      }),
      this.financialEntryRepository.listExpenseByCategoryYears(dto.storeId),
    ]);

    return {
      ...buildExpenseByCategorySummary(rows),
      years,
    };
  }
}
