import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../tenancy/application/pagination';
import {
  SALE_ORDER_CARD_PAYMENT_TYPES,
  SALE_ORDER_CHANNELS,
  SALE_ORDER_STATUSES,
  type SaleOrderCardPaymentType,
  type SaleOrderChannel,
  type SaleOrderStatus,
} from '../../../../domain/entities/sale-order.entity';
import {
  SALE_ORDER_LIST_TABS,
  SALE_ORDER_SORT_OPTIONS,
  type SaleOrderListTab,
  type SaleOrderSortOption,
} from '../../../../domain/repositories/sale-order.repository.interface';

/** Normaliza `?statuses=a&statuses=b` (array) e `?statuses=a` (valor único) para array. */
function toArray({ value }: TransformFnParams): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  return Array.isArray(value) ? value : [value];
}

export class SaleOrderLineHttpDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @MinLength(1)
  quantity!: string;

  @ApiProperty({ example: 1000, description: 'Preço unitário em centavos' })
  @IsInt()
  @Min(0)
  unitPriceCents!: number;
}

export class SaleOrderPaymentHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 1000, description: 'Valor em centavos' })
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty({ example: 'pix' })
  @IsString()
  @MinLength(1)
  methodId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({
    enum: SALE_ORDER_CARD_PAYMENT_TYPES,
    description:
      'Discriminador estrutural para o motor de recebíveis — setado só quando `methodId` corresponde a débito/crédito/Pix reais.',
  })
  @IsOptional()
  @IsIn(SALE_ORDER_CARD_PAYMENT_TYPES)
  cardPaymentType?: SaleOrderCardPaymentType;

  @ApiPropertyOptional({
    example: 'Visa',
    description:
      'Bandeira do cartão. Obrigatória quando `cardPaymentType` é débito/crédito.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  brand?: string;

  @ApiPropertyOptional({
    example: 6,
    description: 'Número de parcelas do crédito.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;
}

/** Compartilhado entre create/update — PUT sempre substitui linhas/pagamentos. */
export class SaleOrderWritableHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  customerName!: string;

  @ApiPropertyOptional({
    description: 'CPF (11) ou CNPJ (14) na nota — só dígitos',
    maxLength: 14,
  })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  consumerDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  stockId?: string;

  @ApiPropertyOptional({ enum: SALE_ORDER_STATUSES })
  @IsOptional()
  @IsIn(SALE_ORDER_STATUSES)
  status?: SaleOrderStatus;

  @ApiPropertyOptional({ enum: SALE_ORDER_CHANNELS })
  @IsOptional()
  @IsIn(SALE_ORDER_CHANNELS)
  channelId?: SaleOrderChannel;

  /**
   * Identidade do vendedor na origem (usuário do Keycloak / membro da empresa).
   * Não é FK no schema, por isso aceita qualquer identificador textual.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sellerId?: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  sellerName?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryFeeCents?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountsCents?: number;

  @ApiProperty({ type: [SaleOrderLineHttpDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleOrderLineHttpDto)
  lines!: SaleOrderLineHttpDto[];

  @ApiPropertyOptional({ type: [SaleOrderPaymentHttpDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleOrderPaymentHttpDto)
  payments?: SaleOrderPaymentHttpDto[];
}

export function toSaleOrderWritableInput(dto: SaleOrderWritableHttpDto) {
  return {
    customerId: dto.customerId,
    customerName: dto.customerName,
    consumerDocument: dto.consumerDocument,
    stockId: dto.stockId,
    status: dto.status,
    channelId: dto.channelId,
    sellerId: dto.sellerId,
    sellerName: dto.sellerName,
    notes: dto.notes,
    deliveryFeeCents: dto.deliveryFeeCents,
    discountsCents: dto.discountsCents,
    lines: dto.lines,
    payments: dto.payments,
  };
}

export class UpdateSaleOrderStatusHttpDto {
  @ApiProperty({ enum: SALE_ORDER_STATUSES })
  @IsIn(SALE_ORDER_STATUSES)
  status!: SaleOrderStatus;
}

export class ListSaleOrdersQueryDto {
  @ApiPropertyOptional({ enum: SALE_ORDER_LIST_TABS })
  @IsOptional()
  @IsIn(SALE_ORDER_LIST_TABS)
  tab?: SaleOrderListTab;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SALE_ORDER_STATUSES, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(SALE_ORDER_STATUSES, { each: true })
  statuses?: SaleOrderStatus[];

  @ApiPropertyOptional({ enum: SALE_ORDER_CHANNELS })
  @IsOptional()
  @IsIn(SALE_ORDER_CHANNELS)
  channelId?: SaleOrderChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountMinCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountMaxCents?: number;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: SALE_ORDER_SORT_OPTIONS })
  @IsOptional()
  @IsIn(SALE_ORDER_SORT_OPTIONS)
  sort?: SaleOrderSortOption;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
