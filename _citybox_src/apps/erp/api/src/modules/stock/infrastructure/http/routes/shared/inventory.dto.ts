import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
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

export class CreateInventoryLineHttpDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({
    description: 'Quantidade contada (Decimal string)',
    example: '10.5',
  })
  @IsString()
  @MinLength(1)
  countedQuantity!: string;
}

export class CreateInventoryHttpDto {
  @ApiProperty({ example: 'Inventário Geral Mensal' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ type: [CreateInventoryLineHttpDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryLineHttpDto)
  lines!: CreateInventoryLineHttpDto[];
}

export class ListInventoriesQueryDto {
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
