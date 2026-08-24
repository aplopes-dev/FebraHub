import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
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
  MOVEMENT_CATEGORY_TYPES,
  type MovementCategoryType,
} from '../../../../domain/entities/movement-category.entity';

export class CreateMovementCategoryHttpDto {
  @ApiProperty({ example: 'Ajuste manual', maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiProperty({ enum: MOVEMENT_CATEGORY_TYPES, example: 'saida' })
  @IsEnum(MOVEMENT_CATEGORY_TYPES)
  type!: MovementCategoryType;

  @ApiProperty({
    type: [String],
    description: 'IDs das unidades (Branch) — obrigatório ≥1',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  branchIds!: string[];
}

export class UpdateMovementCategoryHttpDto extends CreateMovementCategoryHttpDto {}

export class ListMovementCategoriesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MOVEMENT_CATEGORY_TYPES })
  @IsOptional()
  @IsEnum(MOVEMENT_CATEGORY_TYPES)
  type?: MovementCategoryType;

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

export class ListMovementCategoryOptionsQueryDto {
  @ApiPropertyOptional({ enum: MOVEMENT_CATEGORY_TYPES })
  @IsOptional()
  @IsEnum(MOVEMENT_CATEGORY_TYPES)
  type?: MovementCategoryType;
}
