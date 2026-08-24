import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { DashboardDemographicGenderFilter } from '../../../../application/utils/dashboard-patient-demographics.types';

const GENDERS: DashboardDemographicGenderFilter[] = [
  'all',
  'female',
  'male',
  'uninformed',
];

export class GetDashboardPatientDemographicsQueryDto {
  @ApiPropertyOptional({
    enum: GENDERS,
    default: 'all',
    description: 'Filtro de sexo só para a série etária',
  })
  @IsOptional()
  @IsIn(GENDERS)
  gender?: DashboardDemographicGenderFilter;
}
