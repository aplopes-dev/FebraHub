import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DOCUMENT_TEMPLATE_TYPES } from '../../../../domain/mappers/document-template-enum.mapper';

export class DocumentTemplateWriteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  nome!: string;

  @ApiProperty({ enum: DOCUMENT_TEMPLATE_TYPES })
  @IsIn(DOCUMENT_TEMPLATE_TYPES)
  tipo!: (typeof DOCUMENT_TEMPLATE_TYPES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  conteudoHtml!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
