import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
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
import {
  STOCK_LOCATIONS,
  STOCK_PROPERTIES,
  type StockLocation,
  type StockProperty,
} from '../../../../domain/entities/stock.entity';

export class CreateStockHttpDto {
  @ApiProperty({ example: 'Estoque Loja' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: STOCK_LOCATIONS, example: 'proprio' })
  @IsEnum(STOCK_LOCATIONS)
  location!: StockLocation;

  @ApiProperty({ enum: STOCK_PROPERTIES, example: 'proprio' })
  @IsEnum(STOCK_PROPERTIES)
  property!: StockProperty;

  @ApiPropertyOptional({
    type: [String],
    description: 'IDs das unidades (Branch) com acesso ao depósito',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  branchIds?: string[];
}

export class UpdateStockHttpDto extends CreateStockHttpDto {}

export class ListStocksQueryDto {
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
