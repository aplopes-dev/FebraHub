import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ReportOpenTreatmentsRepository } from '../../../domain/repositories/report-open-treatments.repository';
import type {
  ReportOpenTreatmentsPatientStatus,
  ReportOpenTreatmentsWithoutAppointmentRow,
} from '../../../domain/report-open-treatments.types';

export type ListReportOpenTreatmentsWithoutAppointmentInput = {
  storeId: string;
  page?: number;
  perPage?: number;
  status?: ReportOpenTreatmentsPatientStatus;
  now?: Date;
};

export type ListReportOpenTreatmentsWithoutAppointmentOutput = {
  items: ReportOpenTreatmentsWithoutAppointmentRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListReportOpenTreatmentsWithoutAppointmentUseCase
  implements
    IUseCase<
      ListReportOpenTreatmentsWithoutAppointmentInput,
      ListReportOpenTreatmentsWithoutAppointmentOutput
    >
{
  constructor(
    private readonly reportOpenTreatmentsRepository: ReportOpenTreatmentsRepository,
  ) {}

  async execute(
    input: ListReportOpenTreatmentsWithoutAppointmentInput,
  ): Promise<ListReportOpenTreatmentsWithoutAppointmentOutput> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const status = input.status ?? 'active';
    const skip = (page - 1) * perPage;
    const now = input.now ?? new Date();

    const result = await this.reportOpenTreatmentsRepository.findMany(
      input.storeId,
      { skip, take: perPage, status, now },
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
