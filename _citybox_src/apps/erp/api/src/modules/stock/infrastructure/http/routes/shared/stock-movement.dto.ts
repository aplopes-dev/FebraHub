import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../tenancy/application/pagination';
import {
  STOCK_MOVEMENT_TYPES,
  type StockMovementType,
} from '../../../../domain/entities/stock-movement.entity';
import {
  STOCK_MOVEMENT_REASONS,
  type StockMovementReason,
} from '../../../../domain/entities/stock-movement-reason';

export class StockMovementLineHttpDto {
  @ApiProperty()
  @IsUUID('4')
  productId!: string;

  @ApiProperty({
    example: '1.5',
    description: 'Quantidade Decimal como string',
  })
  @IsString()
  quantity!: string;

  @ApiProperty({ example: 1500, description: 'Custo unitário em centavos' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  costCents!: number;
}

export class CreateStockMovementHttpDto {
  @ApiProperty()
  @IsUUID('4')
  stockId!: string;

  @ApiProperty({
    description:
      'Categoria do motivo. Obrigatória: a rota só cria movimentação manual.',
  })
  @IsUUID('4')
  categoryId!: string;

  @ApiProperty({ enum: STOCK_MOVEMENT_TYPES })
  @IsEnum(STOCK_MOVEMENT_TYPES)
  type!: StockMovementType;

  @ApiProperty({ example: '2026-07-28' })
  @IsDateString()
  operatedAt!: string;

  @ApiProperty({ type: [StockMovementLineHttpDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockMovementLineHttpDto)
  lines!: StockMovementLineHttpDto[];
}

export class ListStockMovementsQueryDto {
  @ApiPropertyOptional({
    enum: ['all', ...STOCK_MOVEMENT_TYPES],
    default: 'all',
  })
  @IsOptional()
  @IsString()
  tab?: 'all' | StockMovementType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: STOCK_MOVEMENT_REASONS })
  @IsOptional()
  @IsEnum(STOCK_MOVEMENT_REASONS)
  reason?: StockMovementReason;

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

export class ListStockBalanceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['ok', 'low', 'empty'] })
  @IsOptional()
  @IsEnum(['ok', 'low', 'empty'] as const)
  status?: 'ok' | 'low' | 'empty';

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
