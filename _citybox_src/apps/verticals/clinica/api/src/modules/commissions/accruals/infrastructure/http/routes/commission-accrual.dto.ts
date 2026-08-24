import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PAYMENT_TRIGGERS = [
  'treatment_completed',
  'debit_received',
  'budget_approved',
] as const;

export class CreateCommissionAccrualBodyDto {
  @ApiProperty()
  @IsUUID()
  memberId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  memberName!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  ruleId?: string | null;

  @ApiProperty({ enum: PAYMENT_TRIGGERS })
  @IsIn(PAYMENT_TRIGGERS)
  paymentTrigger!: (typeof PAYMENT_TRIGGERS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialtyName?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  treatmentName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paidValueCents!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  treatmentCostCents!: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  installment?: string | null;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  commissionCents!: number;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  accruedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  sourceFinancialEntryId?: string | null;
}

export class ListOpenCommissionsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filtro por membro (alias de memberId)' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
