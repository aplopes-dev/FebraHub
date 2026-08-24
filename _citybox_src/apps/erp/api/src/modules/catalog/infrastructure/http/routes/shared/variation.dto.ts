import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VARIATION_PRICE_METHODS } from '../../../../domain/entities/variation.entity';

export class SaveVariationOptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Preço em centavos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SaveVariationCalculationDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  chooseFrom!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  chooseTo!: number;

  @ApiProperty()
  @IsBoolean()
  chargeFromSelectedQuantity!: boolean;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  chargeFromQuantity!: number;

  @ApiProperty({ enum: VARIATION_PRICE_METHODS })
  @IsIn(VARIATION_PRICE_METHODS)
  priceMethod!: (typeof VARIATION_PRICE_METHODS)[number];
}

export class SaveVariationDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ type: SaveVariationCalculationDto })
  @ValidateNested()
  @Type(() => SaveVariationCalculationDto)
  calculation!: SaveVariationCalculationDto;

  @ApiProperty({ type: [SaveVariationOptionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaveVariationOptionDto)
  options!: SaveVariationOptionDto[];
}
