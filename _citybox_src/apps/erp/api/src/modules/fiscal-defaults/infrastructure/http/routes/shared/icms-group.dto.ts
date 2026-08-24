import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  ICMS_CSOSN_SUPPORTED,
  ICMS_CST_SUPPORTED,
  UF_RATE_TYPES,
} from '../../../../domain/entities/fiscal-group.entity';

/** Máx. 27 UFs × 2 tipos = 54 linhas. */
const MAX_UF_RATES = 54;

/** As 27 UFs válidas (26 estados + DF) — evita códigos-lixo chegando ao resolvedor. */
export const BRAZIL_UF_CODES = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
] as const;

export class IcmsUfRateHttpDto {
  @ApiProperty({ enum: BRAZIL_UF_CODES, example: 'SP' })
  @IsString()
  @IsIn(BRAZIL_UF_CODES)
  uf!: string;

  @ApiProperty({ enum: UF_RATE_TYPES })
  @IsIn(UF_RATE_TYPES)
  rateType!: string;

  @ApiProperty({ description: 'Alíquota em % (0–100).' })
  @IsNumber()
  @Min(0)
  @Max(100)
  aliquota!: number;
}

export class UpsertIcmsGroupHttpDto {
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    enum: ICMS_CST_SUPPORTED,
    nullable: true,
    description: 'CST (Regime Normal) — exatamente um entre cst/csosn.',
  })
  @IsOptional()
  @IsIn(ICMS_CST_SUPPORTED)
  icmsCst?: string | null;

  @ApiProperty({
    enum: ICMS_CSOSN_SUPPORTED,
    nullable: true,
    description: 'CSOSN (Simples) — exatamente um entre cst/csosn.',
  })
  @IsOptional()
  @IsIn(ICMS_CSOSN_SUPPORTED)
  icmsCsosn?: string | null;

  @ApiProperty({ type: [IcmsUfRateHttpDto] })
  @IsArray()
  @ArrayMaxSize(MAX_UF_RATES)
  @ValidateNested({ each: true })
  @Type(() => IcmsUfRateHttpDto)
  ufRates!: IcmsUfRateHttpDto[];
}

export function toIcmsGroupInput(dto: UpsertIcmsGroupHttpDto): {
  name: string;
  icmsCst: string | null;
  icmsCsosn: string | null;
  ufRates: {
    uf: string;
    rateType: 'INTERNA' | 'INTERESTADUAL';
    aliquota: number;
  }[];
} {
  return {
    name: dto.name,
    icmsCst: dto.icmsCst ?? null,
    icmsCsosn: dto.icmsCsosn ?? null,
    ufRates: dto.ufRates.map((rate) => ({
      uf: rate.uf,
      // Cast estreitado por @IsIn(UF_RATE_TYPES) no DTO + FiscalGroup.validate() na entidade.
      rateType: rate.rateType as 'INTERNA' | 'INTERESTADUAL',
      aliquota: rate.aliquota,
    })),
  };
}
