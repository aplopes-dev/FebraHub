import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateStandaloneEvolutionBodyDto {
  @ApiProperty()
  @IsUUID()
  professionalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalName?: string;

  @ApiProperty()
  @IsDateString()
  finalizedAt!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  evolutionNotes!: string;
}

export class UpdateTreatmentEvolutionBodyDto {
  @ApiProperty()
  @IsUUID()
  professionalId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalName?: string;

  @ApiProperty()
  @IsDateString()
  finalizedAt!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  evolutionNotes!: string;
}
