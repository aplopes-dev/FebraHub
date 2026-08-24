import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PRODUCTION_TYPES } from '../../../../domain/entities/technical-sheet.entity';

export class TechnicalSheetComponentHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsUUID()
  componentProductId!: string;

  @ApiProperty()
  @IsBoolean()
  optional!: boolean;

  @ApiProperty({ description: 'Quantidade (Decimal como number)' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class TechnicalSheetOptionComponentHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty()
  @IsUUID()
  variationOptionId!: string;

  @ApiProperty()
  @IsUUID()
  componentProductId!: string;

  @ApiProperty()
  @IsBoolean()
  optional!: boolean;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class UpsertTechnicalSheetHttpDto {
  @ApiProperty({ enum: PRODUCTION_TYPES })
  @IsEnum(PRODUCTION_TYPES)
  productionType!: (typeof PRODUCTION_TYPES)[number];

  @ApiProperty()
  @IsInt()
  @Min(0)
  maxRemovableComponents!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  markupPercent!: number;

  @ApiProperty({ type: [TechnicalSheetComponentHttpDto] })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => TechnicalSheetComponentHttpDto)
  components!: TechnicalSheetComponentHttpDto[];

  @ApiProperty({ type: [TechnicalSheetOptionComponentHttpDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TechnicalSheetOptionComponentHttpDto)
  optionComponents!: TechnicalSheetOptionComponentHttpDto[];

  @ApiPropertyOptional({
    description:
      'Quando informado, atualiza o preço base (centavos) do produto acabado',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  applyBasePriceCents?: number;
}
