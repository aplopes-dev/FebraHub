import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import {
  filterPatientAcquisitionDetails,
  resolvePatientAcquisitionPeriodRange,
} from '../../utils/dashboard-patient-acquisition.math';
import type {
  DashboardAcquisitionPatientItem,
  DashboardAcquisitionPeriodMode,
  DashboardReferralSourceKey,
} from '../../utils/dashboard-patient-acquisition.types';

export type ListDashboardPatientAcquisitionDetailsDto = {
  storeId: string;
  source: DashboardReferralSourceKey;
  periodMode: DashboardAcquisitionPeriodMode;
  year: number;
  month?: number;
  page?: number;
  perPage?: number;
  search?: string;
};

export type ListDashboardPatientAcquisitionDetailsResult = {
  items: DashboardAcquisitionPatientItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListDashboardPatientAcquisitionDetailsUseCase
  implements
    IUseCase<
      ListDashboardPatientAcquisitionDetailsDto,
      ListDashboardPatientAcquisitionDetailsResult
    >
{
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(
    dto: ListDashboardPatientAcquisitionDetailsDto,
  ): Promise<ListDashboardPatientAcquisitionDetailsResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;

    const range = resolvePatientAcquisitionPeriodRange({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const rows = await this.patientRepository.listPatientsForAcquisitionInRange(
      dto.storeId,
      {
        startAt: range.startAt,
        endAt: range.endAt,
      },
    );

    const filtered = filterPatientAcquisitionDetails({
      rows,
      source: dto.source,
      search: dto.search,
    });

    const total = filtered.length;
    const items = filtered.slice((page - 1) * perPage, page * perPage);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
