import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  DashboardPatientsQuery,
  type DashboardPatientsSummary,
} from '../../utils/dashboard-patients.types';

export type GetDashboardPatientsSummaryDto = {
  storeId: string;
  now?: Date;
};

@Injectable()
export class GetDashboardPatientsSummaryUseCase
  implements IUseCase<GetDashboardPatientsSummaryDto, DashboardPatientsSummary>
{
  constructor(private readonly patientsQuery: DashboardPatientsQuery) {}

  async execute(
    dto: GetDashboardPatientsSummaryDto,
  ): Promise<DashboardPatientsSummary> {
    return this.patientsQuery.getSummary(dto.storeId, dto.now ?? new Date());
  }
}
