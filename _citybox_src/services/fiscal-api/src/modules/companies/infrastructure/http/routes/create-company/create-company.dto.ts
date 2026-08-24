import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import {
  TAX_REGIMES,
  ENVIRONMENTS,
} from '../../../../domain/entities/company.entity';
import { CompanyAddressDto } from '../shared/company-address.dto';

export class CreateCompanyDto {
  @ApiProperty()
  @IsUUID()
  storeId!: string;

  @ApiProperty()
  @IsString()
  @Length(11, 18)
  cnpj!: string;

  @ApiProperty()
  @IsString()
  legalName!: string;

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
    default: false,
    description:
      'Município do emitente aderiu ao Padrão Nacional da NFS-e (FR-020). ' +
      '**Sem `true` aqui a emissão de NFS-e é recusada com 422** — a adesão é ' +
      'fato cadastral do município, não constante de código. Ilhéus/BA (2913606) ' +
      'aderiu pelo Decreto Municipal nº 220/2026.',
  })
  @IsOptional()
  @IsBoolean()
  nationalNfseEnabled?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'CNPJ/CPF do escritório de contabilidade, emitido no grupo `autXML` da ' +
      'NF-e. **A Bahia rejeita a nota sem ele** (rejeição 486), mesmo o schema ' +
      'marcando o grupo como opcional.',
  })
  @IsOptional()
  @IsString()
  accountingOfficeDocument?: string | null;

  @ApiProperty({ enum: TAX_REGIMES })
  @IsIn(TAX_REGIMES)
  taxRegime!: (typeof TAX_REGIMES)[number];

  @ApiProperty()
  @IsString()
  @Length(7, 7)
  cityCodeIbge!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 2)
  uf!: string;

  @ApiProperty({ type: CompanyAddressDto })
  @ValidateNested()
  @Type(() => CompanyAddressDto)
  address!: CompanyAddressDto;

  @ApiProperty({ enum: ENVIRONMENTS, required: false })
  @IsOptional()
  @IsEnum(ENVIRONMENTS)
  defaultEnvironment?: (typeof ENVIRONMENTS)[number];
}
