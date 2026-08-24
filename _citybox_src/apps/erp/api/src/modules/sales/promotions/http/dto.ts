import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../tenancy/application/pagination';

export const PROMOTION_TYPES = [
  'leve_mais_pague_menos',
  'progressivo',
  'desconto_por_valor',
  'brinde_por_valor',
  'desconto_por_quantidade',
  'brinde_por_quantidade',
  'cupom',
] as const;
export type PromotionType = (typeof PROMOTION_TYPES)[number];

export class PromotionWritableHttpDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: PROMOTION_TYPES })
  @IsIn(PROMOTION_TYPES)
  type!: PromotionType;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({
    description: 'Regras específicas do tipo de promoção (livre)',
  })
  @IsOptional()
  @IsObject()
  rulesJson?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  branchIds?: string[];
}

export const PROMOTION_LIST_TABS = ['active', 'deleted'] as const;
export type PromotionListTab = (typeof PROMOTION_LIST_TABS)[number];

export class ListPromotionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PROMOTION_TYPES })
  @IsOptional()
  @IsIn(PROMOTION_TYPES)
  type?: PromotionType;

  @ApiPropertyOptional({ enum: PROMOTION_LIST_TABS, default: 'active' })
  @IsOptional()
  @IsIn(PROMOTION_LIST_TABS)
  tab?: PromotionListTab;

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

export class PreviewPromotionHttpDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  productIds!: string[];

  @ApiProperty({ type: [Number] })
  @IsArray()
  quantities!: number[];
}
