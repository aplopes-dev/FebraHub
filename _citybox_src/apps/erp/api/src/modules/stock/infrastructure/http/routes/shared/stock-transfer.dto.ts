import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../tenancy/application/pagination';

export class CreateStockTransferLineHttpDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '2.5' })
  @IsString()
  @MinLength(1)
  quantity!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  batch?: string;
}

export class CreateStockTransferHttpDto {
  @ApiProperty()
  @IsUUID()
  fromStockId!: string;

  @ApiProperty()
  @IsUUID()
  toStockId!: string;

  @ApiProperty({ example: '2026-07-28T12:00:00.000Z' })
  @IsDateString()
  operatedAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  responsibleName!: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  notes?: string;

  @ApiProperty({ type: [CreateStockTransferLineHttpDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferLineHttpDto)
  lines!: CreateStockTransferLineHttpDto[];
}

export class ListStockTransfersQueryDto {
  @ApiPropertyOptional({ enum: ['active', 'cancelled'] })
  @IsOptional()
  @IsIn(['active', 'cancelled'])
  tab?: 'active' | 'cancelled';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fromStockId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  toStockId?: string;

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
