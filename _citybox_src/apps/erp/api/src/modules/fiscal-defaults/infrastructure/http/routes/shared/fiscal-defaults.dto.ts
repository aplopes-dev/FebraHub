import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  FISCAL_TAX_TYPES,
  type FiscalTaxType,
} from '../../../../domain/entities/fiscal-group.entity';

/** Query da listagem de grupos: filtro opcional por tributo. */
export class ListFiscalGroupsQueryDto {
  @ApiPropertyOptional({ enum: FISCAL_TAX_TYPES })
  @IsOptional()
  @IsIn(FISCAL_TAX_TYPES)
  taxType?: FiscalTaxType;
}

const MAX_CFOP_LENGTH = 10;

export class UpsertFiscalDefaultTaxesHttpDto {
  @ApiProperty({
    nullable: true,
    description: 'Grupo padrão de ICMS (id) ou null.',
  })
  @IsOptional()
  @IsString()
  icmsGroupId?: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Grupo padrão de IPI (id) ou null.',
  })
  @IsOptional()
  @IsString()
  ipiGroupId?: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Grupo padrão de PIS/COFINS (id) ou null.',
  })
  @IsOptional()
  @IsString()
  pisCofinsGroupId?: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Grupo padrão de ISSQN (id) ou null.',
  })
  @IsOptional()
  @IsString()
  issqnGroupId?: string | null;

  @ApiProperty({
    description:
      'CFOP padrão (código do catálogo estático). Vazio = não definido.',
    default: '',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_CFOP_LENGTH)
  cfop?: string;
}

export function toUpsertFiscalDefaultTaxesInput(
  dto: UpsertFiscalDefaultTaxesHttpDto,
): {
  icmsGroupId: string | null;
  ipiGroupId: string | null;
  pisCofinsGroupId: string | null;
  issqnGroupId: string | null;
  cfop: string;
} {
  return {
    icmsGroupId: dto.icmsGroupId ?? null,
    ipiGroupId: dto.ipiGroupId ?? null,
    pisCofinsGroupId: dto.pisCofinsGroupId ?? null,
    issqnGroupId: dto.issqnGroupId ?? null,
    cfop: dto.cfop ?? '',
  };
}
