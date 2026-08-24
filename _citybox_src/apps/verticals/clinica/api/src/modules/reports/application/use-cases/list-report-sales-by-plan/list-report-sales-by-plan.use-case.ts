import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportSalesByPlanRepository } from '../../../domain/repositories/report-sales-by-plan.repository';
import type { ReportSalesByPlanRow } from '../../../domain/report-sales-by-plan.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportSalesByPlanInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportSalesByPlanOutput = {
  items: ReportSalesByPlanRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportSalesByPlanUseCase
  implements IUseCase<ListReportSalesByPlanInput, ListReportSalesByPlanOutput>
{
  constructor(
    private readonly reportSalesByPlanRepository: ReportSalesByPlanRepository,
  ) {}

  async execute(
    input: ListReportSalesByPlanInput,
  ): Promise<ListReportSalesByPlanOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportSalesByPlanRepository.findMany(
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
