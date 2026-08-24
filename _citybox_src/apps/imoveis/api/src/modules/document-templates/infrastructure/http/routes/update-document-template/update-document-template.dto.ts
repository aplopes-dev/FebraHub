import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DOCUMENT_TEMPLATE_TYPES } from '../../../../domain/mappers/document-template-enum.mapper';

export class UpdateDocumentTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  nome?: string;

  @ApiPropertyOptional({ enum: DOCUMENT_TEMPLATE_TYPES })
  @IsOptional()
  @IsIn(DOCUMENT_TEMPLATE_TYPES)
  tipo?: (typeof DOCUMENT_TEMPLATE_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  conteudoHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
