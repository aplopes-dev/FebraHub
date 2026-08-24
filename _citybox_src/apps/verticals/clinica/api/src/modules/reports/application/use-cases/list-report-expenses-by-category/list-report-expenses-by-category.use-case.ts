import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportExpensesByCategoryRepository } from '../../../domain/repositories/report-expenses-by-category.repository';
import type { ReportExpensesByCategoryRow } from '../../../domain/report-expenses-by-category.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportExpensesByCategoryInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportExpensesByCategoryOutput = {
  items: ReportExpensesByCategoryRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportExpensesByCategoryUseCase
  implements
    IUseCase<
      ListReportExpensesByCategoryInput,
      ListReportExpensesByCategoryOutput
    >
{
  constructor(
    private readonly reportExpensesByCategoryRepository: ReportExpensesByCategoryRepository,
  ) {}

  async execute(
    input: ListReportExpensesByCategoryInput,
  ): Promise<ListReportExpensesByCategoryOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportExpensesByCategoryRepository.findMany(
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
