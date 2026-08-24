import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientAnamnesisAnswerDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiPropertyOptional({ enum: ['yes', 'no', 'unknown'] })
  @IsOptional()
  @IsEnum(['yes', 'no', 'unknown'] as const)
  triState?: 'yes' | 'no' | 'unknown';

  @ApiPropertyOptional({ enum: ['left', 'right', 'unknown'] })
  @IsOptional()
  @IsEnum(['left', 'right', 'unknown'] as const)
  lateral?: 'left' | 'right' | 'unknown';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  auxiliaryText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  choiceValue?: string;
}

export class CreatePatientAnamnesisBodyDto {
  @ApiProperty()
  @IsUUID()
  templateId!: string;

  @ApiProperty({ enum: ['professional', 'patient'] })
  @IsEnum(['professional', 'patient'] as const)
  fillingMode!: 'professional' | 'patient';

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

export class SubmitPublicAnamnesisBodyDto {
  @ApiProperty({ type: [PatientAnamnesisAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatientAnamnesisAnswerDto)
  answers!: PatientAnamnesisAnswerDto[];
}
