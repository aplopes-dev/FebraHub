import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientBodyRegionAnnotationBodyDto {
  @ApiProperty({
    description: 'ID da região corporal (ex.: ombro-direito)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  bodyRegionId!: string;

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

export class ListPatientBodyRegionAnnotationsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID da região corporal',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  bodyRegionId?: string;
}
