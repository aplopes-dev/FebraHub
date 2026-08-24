import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportBirthdaysRepository } from '../../../domain/repositories/report-birthdays.repository';
import type {
  ListReportBirthdaysResult,
  ReportBirthdayPatientStatus,
  ReportBirthdayRow,
} from '../../../domain/report-birthday.types';
import { assertCivilDateRange } from '../../../domain/utils/birthday-civil-range';

export type ListReportBirthdaysInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
  status?: ReportBirthdayPatientStatus;
};

export type ListReportBirthdaysOutput = {
  items: ReportBirthdayRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportBirthdaysUseCase
  implements IUseCase<ListReportBirthdaysInput, ListReportBirthdaysOutput>
{
  constructor(
    private readonly reportBirthdaysRepository: ReportBirthdaysRepository,
  ) {}

  async execute(input: ListReportBirthdaysInput): Promise<ListReportBirthdaysOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const status = input.status ?? 'active';
    const skip = (page - 1) * perPage;

    const result: ListReportBirthdaysResult =
      await this.reportBirthdaysRepository.findMany(input.storeId, {
        startDate: range.startDate,
        endDate: range.endDate,
        skip,
        take: perPage,
        status,
      });

    return {
      items: result.items,
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage) || 0,
    };
  }
}
