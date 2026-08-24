import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePatientToothAnnotationBodyDto {
  @ApiProperty({ description: 'Número FDI do dente (ex.: 11, 85)' })
  @Type(() => Number)
  @IsInt()
  @Min(11)
  @Max(85)
  toothNumber!: number;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  professionalName!: string;
}

export class ListPatientToothAnnotationsQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por número FDI do dente' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(11)
  @Max(85)
  toothNumber?: number;
}
