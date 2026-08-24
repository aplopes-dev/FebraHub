import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportSalesByProfessionalRepository } from '../../../domain/repositories/report-sales-by-professional.repository';
import type { ReportSalesByProfessionalRow } from '../../../domain/report-sales-by-professional.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportSalesByProfessionalInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportSalesByProfessionalOutput = {
  items: ReportSalesByProfessionalRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportSalesByProfessionalUseCase
  implements
    IUseCase<
      ListReportSalesByProfessionalInput,
      ListReportSalesByProfessionalOutput
    >
{
  constructor(
    private readonly reportSalesByProfessionalRepository: ReportSalesByProfessionalRepository,
  ) {}

  async execute(
    input: ListReportSalesByProfessionalInput,
  ): Promise<ListReportSalesByProfessionalOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportSalesByProfessionalRepository.findMany(
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
