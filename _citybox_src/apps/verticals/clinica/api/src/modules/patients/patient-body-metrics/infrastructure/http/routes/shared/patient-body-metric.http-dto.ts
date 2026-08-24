import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertPatientBodyMetricBodyDto {
  @ApiProperty({ description: 'Data da medição (yyyy-MM-dd)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  measuredAt!: string;

  @ApiProperty({ description: 'Peso em quilogramas' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  weightKg!: number;

  @ApiProperty({ description: 'Altura em centímetros' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  heightCm!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  professionalName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
