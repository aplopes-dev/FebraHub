import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportSalesByTreatmentRepository } from '../../../domain/repositories/report-sales-by-treatment.repository';
import type { ReportSalesByTreatmentRow } from '../../../domain/report-sales-by-treatment.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportSalesByTreatmentInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportSalesByTreatmentOutput = {
  items: ReportSalesByTreatmentRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportSalesByTreatmentUseCase
  implements
    IUseCase<ListReportSalesByTreatmentInput, ListReportSalesByTreatmentOutput>
{
  constructor(
    private readonly reportSalesByTreatmentRepository: ReportSalesByTreatmentRepository,
  ) {}

  async execute(
    input: ListReportSalesByTreatmentInput,
  ): Promise<ListReportSalesByTreatmentOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportSalesByTreatmentRepository.findMany(
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
