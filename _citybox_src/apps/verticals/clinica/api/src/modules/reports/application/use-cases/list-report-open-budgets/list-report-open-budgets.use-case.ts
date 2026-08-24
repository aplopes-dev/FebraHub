import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportOpenBudgetsRepository } from '../../../domain/repositories/report-open-budgets.repository';
import type { ReportOpenBudgetRow } from '../../../domain/report-open-budgets.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportOpenBudgetsInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportOpenBudgetsOutput = {
  items: ReportOpenBudgetRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportOpenBudgetsUseCase
  implements IUseCase<ListReportOpenBudgetsInput, ListReportOpenBudgetsOutput>
{
  constructor(
    private readonly reportOpenBudgetsRepository: ReportOpenBudgetsRepository,
  ) {}

  async execute(
    input: ListReportOpenBudgetsInput,
  ): Promise<ListReportOpenBudgetsOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportOpenBudgetsRepository.findMany(
      input.storeId,
      {
        startDate: range.startDate,
        endDate: range.endDate,
        skip,
        take: perPage,
      },
    );

    return {
      items: result.items,
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage) || 0,
    };
  }
}
