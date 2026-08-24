import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BatchCreateLeadItemDto {
  @ApiProperty({ description: 'Nome do lead (obrigatório na linha útil)' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchCreateLeadsDto {
  @ApiProperty({
    type: [BatchCreateLeadItemDto],
    description: 'Leads a importar (máx. 500)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BatchCreateLeadItemDto)
  leads!: BatchCreateLeadItemDto[];
}
