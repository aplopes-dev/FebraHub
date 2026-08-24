import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import { buildPatientDemographics } from '../../utils/dashboard-patient-demographics.math';
import type {
  DashboardDemographicGenderFilter,
  DashboardPatientDemographicsResult,
} from '../../utils/dashboard-patient-demographics.types';

export type GetDashboardPatientDemographicsDto = {
  storeId: string;
  gender?: DashboardDemographicGenderFilter;
  now?: Date;
};

@Injectable()
export class GetDashboardPatientDemographicsUseCase implements IUseCase<
  GetDashboardPatientDemographicsDto,
  DashboardPatientDemographicsResult
> {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(
    dto: GetDashboardPatientDemographicsDto,
  ): Promise<DashboardPatientDemographicsResult> {
    const rows = await this.patientRepository.listPatientsForDemographics(
      dto.storeId,
    );

    return buildPatientDemographics({
      rows,
      genderFilter: dto.gender ?? 'all',
      now: dto.now ?? new Date(),
    });
  }
}
