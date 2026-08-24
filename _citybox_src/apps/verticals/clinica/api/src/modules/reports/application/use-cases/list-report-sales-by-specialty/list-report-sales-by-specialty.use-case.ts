import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportSalesBySpecialtyRepository } from '../../../domain/repositories/report-sales-by-specialty.repository';
import type { ReportSalesBySpecialtyRow } from '../../../domain/report-sales-by-specialty.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportSalesBySpecialtyInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportSalesBySpecialtyOutput = {
  items: ReportSalesBySpecialtyRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportSalesBySpecialtyUseCase
  implements
    IUseCase<ListReportSalesBySpecialtyInput, ListReportSalesBySpecialtyOutput>
{
  constructor(
    private readonly reportSalesBySpecialtyRepository: ReportSalesBySpecialtyRepository,
  ) {}

  async execute(
    input: ListReportSalesBySpecialtyInput,
  ): Promise<ListReportSalesBySpecialtyOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportSalesBySpecialtyRepository.findMany(
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
