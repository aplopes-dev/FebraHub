import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PatientAnamnesisAnswerDto } from '../../../../../patient-anamneses/infrastructure/http/routes/shared/patient-anamnesis-body.dto';

const LOCATION_TYPES = ['tooth', 'body_region', 'session', 'none'] as const;

export class CreatePatientTreatmentBodyDto {
  @ApiProperty()
  @IsUUID()
  planId!: string;

  @ApiProperty()
  @IsUUID()
  treatmentId!: string;

  @ApiProperty()
  @IsUUID()
  professionalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalName?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  valueCents!: number;

  @ApiProperty({ enum: LOCATION_TYPES })
  @IsIn(LOCATION_TYPES)
  locationType!: (typeof LOCATION_TYPES)[number];

  /**
   * Vazio é legítimo em `session` e `none` — tratamentos sem região anatômica
   * (nutrição, avaliações e consultas) são criados assim, como já acontece na
   * materialização de orçamento e na inicialização nutricional.
   */
  @ApiProperty()
  @ValidateIf(
    (body: CreatePatientTreatmentBodyDto) =>
      body.locationType === 'tooth' || body.locationType === 'body_region',
  )
  @MinLength(1)
  @IsString()
  locationLabel!: string;
}

export class UpdatePatientTreatmentBodyDto {
  @ApiProperty()
  @IsString()
  diagnosis!: string;

  @ApiProperty()
  @IsString()
  observation!: string;
}

export class ReorderPatientTreatmentsBodyDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds!: string[];
}

export class FinalizePatientTreatmentBodyDto {
  @ApiProperty()
  @IsUUID()
  professionalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalName?: string;

  @ApiProperty()
  @IsDateString()
  finalizedAt!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  evolutionNotes!: string;
}

export class FinalizePatientTreatmentBatchBodyDto extends FinalizePatientTreatmentBodyDto {
  @ApiProperty({ type: [String], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  treatmentIds!: string[];
}

export class InitializePatientNutritionAnamnesisDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consultationReason?: string;

  @ApiPropertyOptional({ type: [PatientAnamnesisAnswerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatientAnamnesisAnswerDto)
  answers?: PatientAnamnesisAnswerDto[];
}

export class InitializePatientNutritionBodyDto {
  @ApiProperty()
  @IsUUID()
  professionalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalName?: string;

  @ApiProperty()
  @IsDateString()
  initiatedAt!: string;

  @ApiPropertyOptional({ type: InitializePatientNutritionAnamnesisDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitializePatientNutritionAnamnesisDto)
  anamnesis?: InitializePatientNutritionAnamnesisDto;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  treatmentPlan?: Record<string, unknown>;
}
