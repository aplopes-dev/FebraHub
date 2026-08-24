import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../../tenancy/application/pagination';
import {
  CARD_CONTRACT_GROUPINGS,
  CARD_CUTOFF_PERIODS,
  CARD_DAY_TYPES,
  CARD_INSTALLMENT_DAY_TYPES,
  type CardContractGrouping,
  type CardCutoffPeriod,
  type CardDayType,
  type CardInstallmentDayType,
} from '../../../../domain/entities/card-contract.entity';
import {
  CARD_CONTRACT_LIST_TABS,
  type CardContractListTab,
} from '../../../../domain/repositories/card-contract.repository.interface';

const MAX_PROVIDER_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
/** Teto folgado: contrato real não passa de um punhado de períodos de corte. */
const MAX_ANTICIPATION_PERIODS = 365;

/**
 * Corpo comum de criação e atualização.
 *
 * Semântica de PUT: campo omitido volta ao default do contrato (ver
 * `resolveCardContractUpdateInput`), não fica com o valor anterior.
 */
export class CardContractWritableHttpDto {
  @ApiProperty({ example: 'Cielo', description: 'Adquirente/operadora' })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PROVIDER_LENGTH)
  provider!: string;

  @ApiPropertyOptional({ description: 'Conta de destino do repasse' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIPTION_LENGTH)
  description?: string;

  @ApiPropertyOptional({
    enum: CARD_CONTRACT_GROUPINGS,
    default: 'no_grouping',
  })
  @IsOptional()
  @IsIn(CARD_CONTRACT_GROUPINGS)
  grouping?: CardContractGrouping;

  @ApiPropertyOptional({ enum: CARD_CUTOFF_PERIODS, default: 'daily' })
  @IsOptional()
  @IsIn(CARD_CUTOFF_PERIODS)
  cutoffPeriod?: CardCutoffPeriod;

  @ApiPropertyOptional({ enum: CARD_DAY_TYPES, default: 'business_days' })
  @IsOptional()
  @IsIn(CARD_DAY_TYPES)
  firstPaymentDayType?: CardDayType;

  @ApiPropertyOptional({
    enum: CARD_INSTALLMENT_DAY_TYPES,
    default: 'business_days',
  })
  @IsOptional()
  @IsIn(CARD_INSTALLMENT_DAY_TYPES)
  installmentDayType?: CardInstallmentDayType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  businessDaysOnly?: boolean;

  @ApiPropertyOptional({ description: 'Tarifa de depósito, em centavos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  depositFeeCents?: number;

  @ApiPropertyOptional({ maximum: MAX_ANTICIPATION_PERIODS })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_ANTICIPATION_PERIODS)
  anticipationPeriods?: number;

  @ApiPropertyOptional({ description: 'Percentual de antecipação' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  anticipationRate?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allEntriesPaidInContract?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  businessDaysDeposit?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateCardContractHttpDto extends CardContractWritableHttpDto {}

export class UpdateCardContractHttpDto extends CardContractWritableHttpDto {}

export class ListCardContractsQueryDto {
  @ApiPropertyOptional({ enum: CARD_CONTRACT_LIST_TABS, default: 'active' })
  @IsOptional()
  @IsIn(CARD_CONTRACT_LIST_TABS)
  tab?: CardContractListTab;

  @ApiPropertyOptional({ description: 'Busca por operadora' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_PROVIDER_LENGTH)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: MAX_PER_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
