import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  DashboardPatientsQuery,
  isDashboardPatientMetricId,
  type DashboardPatientListItem,
  type DashboardPatientMetricId,
} from '../../utils/dashboard-patients.types';

export type ListDashboardPatientsByMetricDto = {
  storeId: string;
  metric: string;
  page?: number;
  perPage?: number;
  search?: string;
  now?: Date;
};

export type ListDashboardPatientsByMetricResult = {
  items: DashboardPatientListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  metric: DashboardPatientMetricId;
};

@Injectable()
export class ListDashboardPatientsByMetricUseCase
  implements
    IUseCase<
      ListDashboardPatientsByMetricDto,
      ListDashboardPatientsByMetricResult
    >
{
  constructor(private readonly patientsQuery: DashboardPatientsQuery) {}

  async execute(
    dto: ListDashboardPatientsByMetricDto,
  ): Promise<ListDashboardPatientsByMetricResult> {
    if (!isDashboardPatientMetricId(dto.metric)) {
      throw new BadRequestException(
        `metric inválido: ${dto.metric}. Use um dos ids suportados.`,
      );
    }

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const now = dto.now ?? new Date();

    const result = await this.patientsQuery.listByMetric(dto.storeId, {
      metric: dto.metric,
      skip: (page - 1) * perPage,
      take: perPage,
      search: dto.search,
      now,
    });

    return {
      items: result.items,
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage) || 0,
      metric: dto.metric,
    };
  }
}
