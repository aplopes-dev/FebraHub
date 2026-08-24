import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../tenancy/application/pagination';

export const CONTRACT_FREQUENCIES = ['monthly', 'yearly'] as const;
export type ContractFrequency = (typeof CONTRACT_FREQUENCIES)[number];

export const CONTRACT_DURATION_TYPES = ['times', 'indeterminate'] as const;
export type ContractDurationType = (typeof CONTRACT_DURATION_TYPES)[number];

export class SalesContractWritableHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  customerName!: string;

  @ApiProperty()
  @IsUUID()
  statusId!: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  sellerName?: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional({ example: '2027-08-01' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiProperty({ example: 12000, description: 'Valor total em centavos' })
  @IsInt()
  @Min(0)
  totalCents!: number;

  @ApiPropertyOptional({ enum: CONTRACT_FREQUENCIES })
  @IsOptional()
  @IsIn(CONTRACT_FREQUENCIES)
  frequency?: ContractFrequency;

  @ApiPropertyOptional({ enum: CONTRACT_DURATION_TYPES })
  @IsOptional()
  @IsIn(CONTRACT_DURATION_TYPES)
  durationType?: ContractDurationType;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationValue?: number;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  firstDueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;
}

export class ListSalesContractsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  statusId?: string;

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

export class ContractStatusWritableHttpDto {
  @ApiProperty({ maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
