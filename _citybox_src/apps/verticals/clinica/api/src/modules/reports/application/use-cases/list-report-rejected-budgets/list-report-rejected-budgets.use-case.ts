import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportRejectedBudgetsRepository } from '../../../domain/repositories/report-rejected-budgets.repository';
import type { ReportRejectedBudgetRow } from '../../../domain/report-rejected-budgets.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportRejectedBudgetsInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportRejectedBudgetsOutput = {
  items: ReportRejectedBudgetRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportRejectedBudgetsUseCase
  implements
    IUseCase<ListReportRejectedBudgetsInput, ListReportRejectedBudgetsOutput>
{
  constructor(
    private readonly reportRejectedBudgetsRepository: ReportRejectedBudgetsRepository,
  ) {}

  async execute(
    input: ListReportRejectedBudgetsInput,
  ): Promise<ListReportRejectedBudgetsOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportRejectedBudgetsRepository.findMany(
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
