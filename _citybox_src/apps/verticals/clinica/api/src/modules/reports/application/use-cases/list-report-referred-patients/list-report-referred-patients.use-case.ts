import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportReferredPatientsRepository } from '../../../domain/repositories/report-referred-patients.repository';
import type { ReportReferredPatientRow } from '../../../domain/report-referred-patients.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportReferredPatientsInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

export type ListReportReferredPatientsOutput = {
  items: ReportReferredPatientRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportReferredPatientsUseCase
  implements
    IUseCase<ListReportReferredPatientsInput, ListReportReferredPatientsOutput>
{
  constructor(
    private readonly reportReferredPatientsRepository: ReportReferredPatientsRepository,
  ) {}

  async execute(
    input: ListReportReferredPatientsInput,
  ): Promise<ListReportReferredPatientsOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const result = await this.reportReferredPatientsRepository.findMany(
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
