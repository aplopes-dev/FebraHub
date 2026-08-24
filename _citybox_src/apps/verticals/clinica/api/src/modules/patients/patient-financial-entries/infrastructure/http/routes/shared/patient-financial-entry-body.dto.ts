import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientFinancialDebitTreatmentBodyDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  planId!: string;

  @ApiProperty()
  @IsString()
  treatmentId!: string;

  @ApiProperty()
  @IsString()
  treatmentName!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  valueCents!: number;

  @ApiProperty()
  @IsString()
  professionalId!: string;

  @ApiProperty({ nullable: true })
  @Type(() => Number)
  @IsInt()
  toothNumber!: number | null;
}

export class PatientFinancialAvulsoDebitBodyDto {
  @ApiProperty({ example: '2026-08-10' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty()
  @IsString()
  observations!: string;

  @ApiProperty({ type: [PatientFinancialDebitTreatmentBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatientFinancialDebitTreatmentBodyDto)
  treatments!: PatientFinancialDebitTreatmentBodyDto[];
}

export class UpdatePatientFinancialDebitTreatmentBodyDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  valueCents!: number;

  @ApiProperty()
  @IsString()
  professionalId!: string;
}

export class UpdatePatientFinancialEntryBodyDto {
  @ApiProperty()
  @IsString()
  observations!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  valueCents?: number;

  @ApiPropertyOptional({ type: [UpdatePatientFinancialDebitTreatmentBodyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePatientFinancialDebitTreatmentBodyDto)
  treatments?: UpdatePatientFinancialDebitTreatmentBodyDto[];
}

export class ReceivePatientFinancialEntryBodyDto {
  @ApiProperty({
    enum: ['cash', 'credit', 'debit', 'pix', 'transfer', 'boleto', 'check'],
  })
  @IsEnum(['cash', 'credit', 'debit', 'pix', 'transfer', 'boleto', 'check'])
  paymentMethod!:
    | 'cash'
    | 'credit'
    | 'debit'
    | 'pix'
    | 'transfer'
    | 'boleto'
    | 'check';

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paidValueCents!: number;

  @ApiProperty({ example: '2026-08-10' })
  @IsDateString()
  receivedAt!: string;

  @ApiProperty()
  @IsString()
  cashRegisterId!: string;

  @ApiProperty()
  @IsString()
  observations!: string;

  @ApiPropertyOptional({ enum: ['no-fee', 'with-fee'] })
  @IsOptional()
  @IsEnum(['no-fee', 'with-fee'])
  cardMode?: 'no-fee' | 'with-fee';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkIssueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkHolderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkBank?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkDocument?: string;
}
