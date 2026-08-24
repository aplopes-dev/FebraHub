import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportExcludedRevenuesRepository } from '../../../domain/repositories/report-excluded-revenues.repository';
import type { ReportExcludedRevenueRow } from '../../../domain/report-excluded-revenues.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportExcludedRevenuesInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportExcludedRevenuesOutput = {
  items: ReportExcludedRevenueRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportExcludedRevenuesUseCase
  implements
    IUseCase<ListReportExcludedRevenuesInput, ListReportExcludedRevenuesOutput>
{
  constructor(
    private readonly reportExcludedRevenuesRepository: ReportExcludedRevenuesRepository,
  ) {}

  async execute(
    input: ListReportExcludedRevenuesInput,
  ): Promise<ListReportExcludedRevenuesOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportExcludedRevenuesRepository.findMany(
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
