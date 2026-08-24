import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PriceAdjustmentTypeDto {
  manual = 'manual',
  percent_markup = 'percent_markup',
  percent_discount = 'percent_discount',
  fixed_over_base = 'fixed_over_base',
}

export class SavePriceListDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: PriceAdjustmentTypeDto })
  @IsEnum(PriceAdjustmentTypeDto)
  adjustmentType!: PriceAdjustmentTypeDto;

  @ApiProperty({
    description:
      'Percentual (tipos %) ou centavos (fixed_over_base). Ignorado/zerado se manual.',
  })
  @IsInt()
  @Min(0)
  adjustmentValue!: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  channels!: string[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ReorderPriceListsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  orderedIds!: string[];
}

export class PriceListItemInputDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Preço na lista em centavos' })
  @IsInt()
  @Min(0)
  priceCents!: number;
}

export class ReplacePriceListItemsDto {
  @ApiProperty({ type: [PriceListItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListItemInputDto)
  items!: PriceListItemInputDto[];
}
