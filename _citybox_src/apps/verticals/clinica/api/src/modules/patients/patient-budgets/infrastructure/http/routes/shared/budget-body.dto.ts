import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BudgetDiscountBodyDto {
  @ApiProperty({ enum: ['fixed', 'percent'] })
  @IsEnum(['fixed', 'percent'])
  type!: 'fixed' | 'percent';

  @ApiProperty({
    description:
      'Centavos (fixed) ou percentual em centésimos (percent: 1050 = 10,5%; 2000 = 20%)',
    example: 2000,
  })
  @IsInt()
  @Min(0)
  value!: number;
}

export class BudgetItemBodyDto {
  @ApiProperty()
  @IsUUID()
  planId!: string;

  @ApiProperty()
  @IsUUID()
  treatmentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  professionalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalName?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  valueCents!: number;

  @ApiProperty({ enum: ['tooth', 'body_region', 'session', 'none'] })
  @IsEnum(['tooth', 'body_region', 'session', 'none'])
  locationType!: 'tooth' | 'body_region' | 'session' | 'none';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationLabel?: string;

  @ApiPropertyOptional({
    description: 'Índice da sessão (1..N). Só persiste quando sessionTotal ≥ 2.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  sessionIndex?: number | null;

  @ApiPropertyOptional({
    description: 'Total de sessões do pacote. Só persiste quando ≥ 2.',
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  sessionTotal?: number | null;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class UpsertBudgetBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  responsibleId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibleName?: string;

  @ApiPropertyOptional({ type: BudgetDiscountBodyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetDiscountBodyDto)
  discount?: BudgetDiscountBodyDto | null;

  @ApiProperty()
  @IsBoolean()
  installmentEnabled!: boolean;

  @ApiProperty()
  @IsInt()
  @Min(0)
  downPaymentCents!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  installmentsCount!: number;

  @ApiProperty({ type: [BudgetItemBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemBodyDto)
  items!: BudgetItemBodyDto[];
}

export class BudgetApproveInstallmentBodyDto {
  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ example: 10000 })
  @IsInt()
  @Min(0)
  valueCents!: number;
}

export class UpdateBudgetStatusBodyDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'expired', 'pending'] })
  @IsEnum(['approved', 'rejected', 'expired', 'pending'])
  status!: 'approved' | 'rejected' | 'expired' | 'pending';

  @ApiPropertyOptional({
    description: 'Data da reprovação (yyyy-MM-dd). Obrigatório quando status=rejected.',
  })
  @IsOptional()
  @IsDateString()
  rejectedAt?: string;

  @ApiPropertyOptional({
    description: 'Motivo da reprovação (máx. 255). Obrigatório quando status=rejected.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rejectionReason?: string;

  @ApiPropertyOptional({
    description:
      'Data de vencimento dos lançamentos gerados na aprovação (yyyy-MM-dd). Só aplica quando status=approved.',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description:
      'Parcelas customizadas na aprovação (vencimento + valor). Só aplica quando status=approved e o orçamento está parcelado. A soma dos valores deve cobrir o saldo (final − entrada).',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        dueDate: { type: 'string', example: '2026-08-20' },
        valueCents: { type: 'integer', example: 10000 },
      },
    },
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetApproveInstallmentBodyDto)
  installments?: BudgetApproveInstallmentBodyDto[];
}
