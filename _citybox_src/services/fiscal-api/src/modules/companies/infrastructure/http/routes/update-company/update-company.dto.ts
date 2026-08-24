import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ENVIRONMENTS,
  TAX_REGIMES,
} from '../../../../domain/entities/company.entity';
import {
  JUSTIFICATION_MAX_LENGTH,
  JUSTIFICATION_MIN_LENGTH,
} from '../../../../../../shared/domain/fiscal-justification.constants';
import { CompanyAddressDto } from '../shared/company-address.dto';

export class UpdateCompanyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  tradeName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  stateRegistration?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  municipalRegistration?: string | null;

  @ApiProperty({
    required: false,
    description:
      'Município do emitente aderiu ao Padrão Nacional da NFS-e (FR-020). ' +
      'Sem `true` a emissão de NFS-e é recusada com 422.',
  })
  @IsOptional()
  @IsBoolean()
  nationalNfseEnabled?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'CNPJ/CPF do escritório de contabilidade (`autXML`). A Bahia rejeita a ' +
      'nota sem ele (rejeição 486).',
  })
  @IsOptional()
  @IsString()
  accountingOfficeDocument?: string | null;

  @ApiProperty({ enum: TAX_REGIMES, required: false })
  @IsOptional()
  @IsIn(TAX_REGIMES)
  taxRegime?: (typeof TAX_REGIMES)[number];

  @ApiProperty({ type: CompanyAddressDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyAddressDto)
  address?: CompanyAddressDto;

  @ApiProperty({ enum: ENVIRONMENTS, required: false })
  @IsOptional()
  @IsIn(ENVIRONMENTS)
  defaultEnvironment?: (typeof ENVIRONMENTS)[number];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
    minLength: JUSTIFICATION_MIN_LENGTH,
    maxLength: JUSTIFICATION_MAX_LENGTH,
    description:
      'Texto padrão usado ao inutilizar uma faixa de numeração não utilizada ' +
      '(spec erp/023, N6). `null` limpa o campo.',
  })
  @IsOptional()
  @IsString()
  @MinLength(JUSTIFICATION_MIN_LENGTH, {
    message: `inutilizationJustification deve ter no mínimo ${JUSTIFICATION_MIN_LENGTH} caracteres (exigência SEFAZ)`,
  })
  @MaxLength(JUSTIFICATION_MAX_LENGTH, {
    message: `inutilizationJustification deve ter no máximo ${JUSTIFICATION_MAX_LENGTH} caracteres (exigência SEFAZ)`,
  })
  inutilizationJustification?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    minLength: JUSTIFICATION_MIN_LENGTH,
    maxLength: JUSTIFICATION_MAX_LENGTH,
    description:
      'Texto padrão usado ao cancelar um documento fiscal (spec erp/023, N6). ' +
      '`null` limpa o campo.',
  })
  @IsOptional()
  @IsString()
  @MinLength(JUSTIFICATION_MIN_LENGTH, {
    message: `cancellationJustification deve ter no mínimo ${JUSTIFICATION_MIN_LENGTH} caracteres (exigência SEFAZ)`,
  })
  @MaxLength(JUSTIFICATION_MAX_LENGTH, {
    message: `cancellationJustification deve ter no máximo ${JUSTIFICATION_MAX_LENGTH} caracteres (exigência SEFAZ)`,
  })
  cancellationJustification?: string | null;
}
