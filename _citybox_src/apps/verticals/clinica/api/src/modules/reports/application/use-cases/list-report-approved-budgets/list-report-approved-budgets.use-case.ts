import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportApprovedBudgetsRepository } from '../../../domain/repositories/report-approved-budgets.repository';
import type { ReportApprovedBudgetRow } from '../../../domain/report-approved-budgets.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportApprovedBudgetsInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportApprovedBudgetsOutput = {
  items: ReportApprovedBudgetRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportApprovedBudgetsUseCase
  implements IUseCase<ListReportApprovedBudgetsInput, ListReportApprovedBudgetsOutput>
{
  constructor(
    private readonly reportApprovedBudgetsRepository: ReportApprovedBudgetsRepository,
  ) {}

  async execute(
    input: ListReportApprovedBudgetsInput,
  ): Promise<ListReportApprovedBudgetsOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportApprovedBudgetsRepository.findMany(
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
