import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import {
  aggregatePatientAcquisition,
  resolvePatientAcquisitionPeriodRange,
} from '../../utils/dashboard-patient-acquisition.math';
import type {
  DashboardAcquisitionAggregate,
  DashboardAcquisitionPeriodMode,
} from '../../utils/dashboard-patient-acquisition.types';

export type GetDashboardPatientAcquisitionDto = {
  storeId: string;
  periodMode: DashboardAcquisitionPeriodMode;
  year: number;
  month?: number;
};

export type GetDashboardPatientAcquisitionResult = {
  totalCount: number;
  aggregates: DashboardAcquisitionAggregate[];
  years: number[];
};

@Injectable()
export class GetDashboardPatientAcquisitionUseCase
  implements
    IUseCase<
      GetDashboardPatientAcquisitionDto,
      GetDashboardPatientAcquisitionResult
    >
{
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(
    dto: GetDashboardPatientAcquisitionDto,
  ): Promise<GetDashboardPatientAcquisitionResult> {
    if (dto.periodMode === 'monthly' && dto.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const range = resolvePatientAcquisitionPeriodRange({
      periodMode: dto.periodMode,
      year: dto.year,
      month: dto.month,
    });

    const [rows, years] = await Promise.all([
      this.patientRepository.listPatientsForAcquisitionInRange(dto.storeId, {
        startAt: range.startAt,
        endAt: range.endAt,
      }),
      this.patientRepository.listAcquisitionYears(dto.storeId),
    ]);

    const { totalCount, aggregates } = aggregatePatientAcquisition(rows);

    return { totalCount, aggregates, years };
  }
}
