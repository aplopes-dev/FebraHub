import { Type } from 'class-transformer';
import {
  IsArray,
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
import {
  POS_DELIVERY_FULFILLMENTS,
  POS_DELIVERY_STATUSES,
  type PosDeliveryFulfillment,
  type PosDeliveryOrderStatus,
} from '../../domain/entities/pos-delivery-order.entity';

export class PosDeliveryLineHttpDto {
  @IsUUID()
  productId!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  productName!: string;
  @IsString()
  @MinLength(1)
  quantity!: string;
  @IsInt()
  @Min(0)
  unitPriceCents!: number;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

class PosDeliveryHeaderHttpDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;
  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;
  @IsOptional()
  @IsIn(POS_DELIVERY_FULFILLMENTS)
  fulfillment?: PosDeliveryFulfillment;
  @IsOptional()
  @IsString()
  @MaxLength(20)
  addressZipCode?: string;
  @IsOptional()
  @IsString()
  @MaxLength(160)
  addressStreet?: string;
  @IsOptional()
  @IsString()
  @MaxLength(30)
  addressNumber?: string;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressDistrict?: string;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  addressCity?: string;
  @IsOptional()
  @IsString()
  @MaxLength(2)
  addressState?: string;
  @IsOptional()
  @IsString()
  @MaxLength(160)
  addressComplement?: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressText?: string;
  @IsOptional()
  @IsInt()
  @Min(0)
  feeCents?: number;
  @IsOptional()
  @IsUUID()
  courierId?: string;
  @IsOptional()
  @IsString()
  @MaxLength(160)
  courierName?: string;
}

export class CreatePosDeliveryOrderHttpDto extends PosDeliveryHeaderHttpDto {
  @IsIn(POS_DELIVERY_FULFILLMENTS)
  declare fulfillment: PosDeliveryFulfillment;
  @IsString()
  @MaxLength(160)
  declare customerName: string;
  @IsInt()
  @Min(0)
  declare feeCents: number;
  @IsOptional()
  @IsUUID()
  operatorUserId?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosDeliveryLineHttpDto)
  lines!: PosDeliveryLineHttpDto[];
}

export class UpdatePosDeliveryOrderHttpDto extends PosDeliveryHeaderHttpDto {}

export class ReplacePosDeliveryLinesHttpDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosDeliveryLineHttpDto)
  lines!: PosDeliveryLineHttpDto[];
}

/** Status operacional (inclui `delivered` = Concluído). Pagamento é SaleOrder ativa. */
const POS_DELIVERY_STATUS_PATCH = [
  'received',
  'preparing',
  'dispatched',
  'delivered',
  'cancelled',
] as const;

export class UpdatePosDeliveryStatusHttpDto {
  @IsIn(POS_DELIVERY_STATUS_PATCH)
  status!: PosDeliveryOrderStatus;
}

export class ListPosDeliveryOrdersQueryDto {
  @IsOptional()
  @IsIn(POS_DELIVERY_STATUSES)
  status?: PosDeliveryOrderStatus;
  @IsOptional()
  @IsIn(POS_DELIVERY_FULFILLMENTS)
  fulfillment?: PosDeliveryFulfillment;
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;
}
