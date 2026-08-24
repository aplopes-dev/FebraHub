import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../tenancy/application/pagination';
import { PRODUCTION_ORDER_LIST_TABS } from '../../../../domain/repositories/production-order.repository.interface';

export class CreateProductionOrderHttpDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '10' })
  @IsString()
  @MinLength(1)
  plannedQuantity!: string;

  @ApiProperty()
  @IsUUID()
  sourceStockId!: string;

  @ApiProperty()
  @IsUUID()
  destinationStockId!: string;

  @ApiProperty({ example: '2026-07-30' })
  @IsDateString()
  expectedDate!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observation?: string;
}

export class FinalizeProductionOrderHttpDto {
  @ApiProperty({ example: '10' })
  @IsString()
  @MinLength(1)
  producedQuantity!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observation?: string;
}

export class AddProductionHistoryCommentHttpDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}

export class ListProductionOrdersQueryDto {
  @ApiPropertyOptional({ enum: PRODUCTION_ORDER_LIST_TABS })
  @IsOptional()
  @IsIn(PRODUCTION_ORDER_LIST_TABS)
  tab?: (typeof PRODUCTION_ORDER_LIST_TABS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

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
