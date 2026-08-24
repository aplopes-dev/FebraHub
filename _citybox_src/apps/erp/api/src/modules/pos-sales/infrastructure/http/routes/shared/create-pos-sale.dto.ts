import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SALE_ORDER_CARD_PAYMENT_TYPES,
  type SaleOrderCardPaymentType,
} from '../../../../../sales/domain/entities/sale-order.entity';

export class CreatePosSaleLineHttpDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @MinLength(1)
  quantity!: string;

  @ApiProperty({ example: 1000 })
  @IsInt()
  @Min(0)
  unitPriceCents!: number;
}

export class CreatePosSalePaymentHttpDto {
  @ApiProperty({ example: 1000 })
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty({ description: 'UUID da PaymentMethod ativa' })
  @IsUUID()
  methodId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ enum: SALE_ORDER_CARD_PAYMENT_TYPES })
  @IsOptional()
  @IsIn(SALE_ORDER_CARD_PAYMENT_TYPES)
  cardPaymentType?: SaleOrderCardPaymentType;

  @ApiPropertyOptional({ example: 'Visa' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  brand?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;
}

export class CreatePosSaleHttpDto {
  @ApiPropertyOptional({
    description: 'Pedido operacional de delivery vinculado ao checkout',
  })
  @IsOptional()
  @IsUUID()
  posDeliveryOrderId?: string;

  @ApiProperty({ description: 'Operador logado no terminal' })
  @IsUUID()
  operatorId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    maxLength: 160,
    description: 'Default: Consumidor Final',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;

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
  @IsString()
  @MaxLength(64)
  sellerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  sellerName?: string;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({
    description: 'userId do supervisor que autorizou desconto acima da alçada',
  })
  @IsOptional()
  @IsUUID()
  discountAuthorizedByUserId?: string;

  @ApiProperty({ type: [CreatePosSaleLineHttpDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePosSaleLineHttpDto)
  lines!: CreatePosSaleLineHttpDto[];

  @ApiProperty({ type: [CreatePosSalePaymentHttpDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePosSalePaymentHttpDto)
  payments!: CreatePosSalePaymentHttpDto[];
}
