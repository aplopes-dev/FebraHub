import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_PER_PAGE } from '../../../../../tenancy/application/pagination';

export class OpenCashSessionHttpDto {
  @ApiProperty({ description: 'Membership.userId do operador' })
  @IsUUID()
  operatorUserId!: string;

  @ApiProperty({ description: 'Fundo de caixa em centavos' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  openingFloatCents!: number;
}

export class AddCashMovementHttpDto {
  @ApiProperty({ enum: ['withdrawal', 'reinforcement'] })
  @IsEnum(['withdrawal', 'reinforcement'])
  type!: 'withdrawal' | 'reinforcement';

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({ description: 'Membership.userId do operador' })
  @IsUUID()
  operatorUserId!: string;

  @ApiPropertyOptional({
    description: 'Supervisor (userId) — obrigatório acima da alçada',
  })
  @IsOptional()
  @IsUUID()
  authorizedByUserId?: string;
}

export class CloseCashSessionHttpDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  countedCashCents!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  countedCreditCents!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  countedDebitCents!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  countedVoucherCents!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  countedOtherCents!: number;
}

export class ListCashSessionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  posTerminalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  operatorName?: string;

  @ApiPropertyOptional({ description: 'ISO datetime (openedAt >=)' })
  @IsOptional()
  @IsDateString()
  openedFrom?: string;

  @ApiPropertyOptional({ description: 'ISO datetime (openedAt <=)' })
  @IsOptional()
  @IsDateString()
  openedTo?: string;

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
  @Max(MAX_PER_PAGE)
  perPage?: number;
}

export class ListSessionSalesQueryDto {
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
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
