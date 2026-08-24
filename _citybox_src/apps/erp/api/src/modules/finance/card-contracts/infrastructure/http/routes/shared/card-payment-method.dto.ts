import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CARD_PAYMENT_METHOD_TYPES,
  type CardPaymentMethodType,
} from '../../../../domain/entities/card-payment-method.entity';

const MAX_BRAND_LENGTH = 60;
const MAX_INSTALLMENTS = 99;
const MAX_DAYS = 365;
const MAX_TIERS = 50;

export class CardRateTierHttpDto {
  @ApiPropertyOptional({ description: 'Mantido em edição; gerado se ausente' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ minimum: 1, maximum: MAX_INSTALLMENTS })
  @IsInt()
  @Min(1)
  @Max(MAX_INSTALLMENTS)
  minInstallments!: number;

  @ApiProperty({ minimum: 1, maximum: MAX_INSTALLMENTS })
  @IsInt()
  @Min(1)
  @Max(MAX_INSTALLMENTS)
  maxInstallments!: number;

  @ApiProperty({ description: 'Percentual da faixa' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  rate!: number;
}

/**
 * Corpo comum de criação e atualização da forma de pagamento.
 *
 * `progressiveTiers` só é gravado com `progressiveEnabled = true`: faixa
 * guardada com o progressivo desligado deixaria o cadastro anunciando taxa única
 * e taxa por faixa ao mesmo tempo.
 */
export class CardPaymentMethodWritableHttpDto {
  @ApiProperty({ enum: CARD_PAYMENT_METHOD_TYPES })
  @IsIn(CARD_PAYMENT_METHOD_TYPES)
  type!: CardPaymentMethodType;

  @ApiPropertyOptional({ example: 'Visa' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_BRAND_LENGTH)
  brand?: string | null;

  @ApiPropertyOptional({ description: 'Percentual da operadora' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  rate?: number | null;

  @ApiPropertyOptional({
    description: 'Tarifa fixa por transação, em centavos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  feeCents?: number | null;

  @ApiPropertyOptional({ maximum: MAX_DAYS })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_DAYS)
  settlementDays?: number | null;

  @ApiPropertyOptional({ maximum: MAX_INSTALLMENTS })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_INSTALLMENTS)
  minInstallments?: number | null;

  @ApiPropertyOptional({ maximum: MAX_INSTALLMENTS })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_INSTALLMENTS)
  maxInstallments?: number | null;

  @ApiPropertyOptional({ maximum: MAX_DAYS })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_DAYS)
  firstPaymentDays?: number | null;

  @ApiPropertyOptional({ maximum: MAX_DAYS })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_DAYS)
  daysBetweenInstallments?: number | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  progressiveEnabled?: boolean;

  @ApiPropertyOptional({ type: [CardRateTierHttpDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TIERS)
  @ValidateNested({ each: true })
  @Type(() => CardRateTierHttpDto)
  progressiveTiers?: CardRateTierHttpDto[];
}

export class CreatePaymentMethodHttpDto extends CardPaymentMethodWritableHttpDto {}

export class UpdatePaymentMethodHttpDto extends CardPaymentMethodWritableHttpDto {}
