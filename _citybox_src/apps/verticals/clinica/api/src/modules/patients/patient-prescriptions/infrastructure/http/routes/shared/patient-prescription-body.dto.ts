import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PRESCRIPTION_MEASURES } from '../../../../domain/entities/patient-prescription.entity';

export class PrescriptionItemBodyDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  quantity!: string;

  @ApiProperty({ enum: PRESCRIPTION_MEASURES })
  @IsEnum(PRESCRIPTION_MEASURES)
  measure!: (typeof PRESCRIPTION_MEASURES)[number];

  @ApiProperty()
  @IsString()
  posology!: string;

  @ApiProperty()
  @IsString()
  notes!: string;
}

export class UpsertPatientPrescriptionBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  professionalId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  professionalName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicName?: string;

  @ApiProperty({ example: '2026-07-06' })
  @IsDateString()
  issuedDate!: string;

  @ApiProperty({ type: [PrescriptionItemBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemBodyDto)
  items!: PrescriptionItemBodyDto[];

  @ApiPropertyOptional({ enum: ['CRM', 'CRO', 'CREFITO'] })
  @IsOptional()
  @IsEnum(['CRM', 'CRO', 'CREFITO'] as const)
  councilType?: 'CRM' | 'CRO' | 'CREFITO';

  @ApiPropertyOptional({ description: 'Somente dígitos' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  councilNumber?: string;

  @ApiPropertyOptional({ description: 'UF (CRM/CRO) ou regional CREFITO 01–20' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]{2}$/)
  councilUf?: string;
}
