import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ADDITIONAL_INFO_TARGETS,
  FISCAL_DOCUMENT_TYPES,
} from '../../../../domain/entities/fiscal-additional-info.entity';

/** Filtro da listagem — enum inválido é recusado (400) pelo ValidationPipe. */
export class ListFiscalAdditionalInfosQueryDto {
  @ApiPropertyOptional({ enum: FISCAL_DOCUMENT_TYPES })
  @IsOptional()
  @IsIn(FISCAL_DOCUMENT_TYPES)
  documentType?: string;
}

/** Teto folgado de validação de entrada; a entidade aplica o teto real do XSD por campo. */
const TEXT_INPUT_MAX = 5000;

export class CreateFiscalAdditionalInfoHttpDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ maxLength: TEXT_INPUT_MAX })
  @IsString()
  @MinLength(1)
  @MaxLength(TEXT_INPUT_MAX)
  text!: string;

  @ApiProperty({ enum: FISCAL_DOCUMENT_TYPES })
  @IsIn(FISCAL_DOCUMENT_TYPES)
  documentType!: string;

  @ApiProperty({ enum: ADDITIONAL_INFO_TARGETS })
  @IsIn(ADDITIONAL_INFO_TARGETS)
  target!: string;
}

/** Na edição o `documentType` não muda (imutável na entidade). */
export class UpdateFiscalAdditionalInfoHttpDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ maxLength: TEXT_INPUT_MAX })
  @IsString()
  @MinLength(1)
  @MaxLength(TEXT_INPUT_MAX)
  text!: string;

  @ApiProperty({ enum: ADDITIONAL_INFO_TARGETS })
  @IsIn(ADDITIONAL_INFO_TARGETS)
  target!: string;
}
