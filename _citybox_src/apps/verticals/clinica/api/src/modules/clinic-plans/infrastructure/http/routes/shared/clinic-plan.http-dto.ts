import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CLINIC_PLAN_LOCATION_UI_TYPES } from '../../../../domain/types/clinic-plan-location-ui-type';

export class PlanTreatmentBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'R$ 150,00' })
  @IsString()
  treatmentValue!: string;

  @ApiProperty({ example: 'R$ 80,00' })
  @IsString()
  treatmentCost!: string;

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  acceptsFaces?: boolean;

  @ApiPropertyOptional({
    enum: CLINIC_PLAN_LOCATION_UI_TYPES,
    description: 'Override opcional do locationUiType da especialidade.',
  })
  @IsOptional()
  @IsIn(CLINIC_PLAN_LOCATION_UI_TYPES)
  locationUiType?: (typeof CLINIC_PLAN_LOCATION_UI_TYPES)[number];
}

export class PlanSpecialtyBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    enum: CLINIC_PLAN_LOCATION_UI_TYPES,
    default: 'tooth',
    description:
      'Define o seletor de local no orçamento (dente, HOF, corpo, sessão ou nenhum).',
  })
  @IsOptional()
  @IsIn(CLINIC_PLAN_LOCATION_UI_TYPES)
  locationUiType?: (typeof CLINIC_PLAN_LOCATION_UI_TYPES)[number];

  @ApiProperty({ type: [PlanTreatmentBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanTreatmentBodyDto)
  treatments!: PlanTreatmentBodyDto[];
}

export class CreateClinicPlanBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsIn(['active', 'inactive'])
  status!: 'active' | 'inactive';

  @ApiProperty()
  @IsBoolean()
  isDefault!: boolean;

  @ApiPropertyOptional({ enum: ['copy-default', 'empty'] })
  @IsOptional()
  @IsIn(['copy-default', 'empty'])
  treatmentInit?: 'copy-default' | 'empty';

  @ApiProperty({ type: [PlanSpecialtyBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanSpecialtyBodyDto)
  specialties!: PlanSpecialtyBodyDto[];
}

export class UpdateClinicPlanBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsIn(['active', 'inactive'])
  status!: 'active' | 'inactive';

  @ApiProperty()
  @IsBoolean()
  isDefault!: boolean;

  @ApiProperty({ type: [PlanSpecialtyBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanSpecialtyBodyDto)
  specialties!: PlanSpecialtyBodyDto[];
}

export class UpdateClinicPlanStatusBodyDto {
  @ApiProperty()
  @IsBoolean()
  active!: boolean;
}
