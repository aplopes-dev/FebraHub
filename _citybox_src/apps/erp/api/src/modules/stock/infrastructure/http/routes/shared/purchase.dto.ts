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
import { Type } from 'class-transformer';
import { MAX_PER_PAGE } from '../../../../../tenancy/application/pagination';
import {
  PURCHASE_DELIVERY_STATUSES,
  PURCHASE_LINE_STATUSES,
  type PurchaseDeliveryStatus,
  type PurchaseLineStatus,
} from '../../../../domain/entities/purchase.entity';
import {
  PURCHASE_LIST_STATUSES,
  PURCHASE_LIST_TABS,
  type PurchaseListStatus,
  type PurchaseListTab,
} from '../../../../domain/repositories/purchase.repository.interface';

export class PurchaseLineHttpDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '10' })
  @IsString()
  @MinLength(1)
  quantity!: string;

  @ApiProperty({ example: 500, description: 'Custo unitário em centavos' })
  @IsInt()
  @Min(0)
  costCents!: number;

  @ApiPropertyOptional({ enum: PURCHASE_LINE_STATUSES })
  @IsOptional()
  @IsIn(PURCHASE_LINE_STATUSES)
  status?: PurchaseLineStatus;
}

/**
 * Compartilhado entre create/update — a semântica de PUT sempre substitui o
 * conjunto de linhas, então os dois formulários têm o mesmo shape.
 */
export class PurchaseWritableHttpDto {
  @ApiProperty()
  @IsUUID()
  stockId!: string;

  @ApiProperty()
  @IsUUID()
  supplierId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @ApiProperty({ enum: PURCHASE_DELIVERY_STATUSES })
  @IsIn(PURCHASE_DELIVERY_STATUSES)
  deliveryStatus!: PurchaseDeliveryStatus;

  @ApiProperty({ example: '2026-07-28' })
  @IsDateString()
  purchasedAt!: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  series?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  invoiceNumber?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ example: 0, description: 'Frete em centavos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  freightCents?: number;

  @ApiPropertyOptional({ example: 0, description: 'Descontos em centavos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountsCents?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Outras despesas em centavos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  otherExpensesCents?: number;

  @ApiProperty({ type: [PurchaseLineHttpDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineHttpDto)
  lines!: PurchaseLineHttpDto[];
}

export function toPurchaseWritableInput(dto: PurchaseWritableHttpDto) {
  return {
    stockId: dto.stockId,
    supplierId: dto.supplierId,
    carrierId: dto.carrierId,
    deliveryStatus: dto.deliveryStatus,
    purchasedAt: new Date(dto.purchasedAt),
    series: dto.series,
    invoiceNumber: dto.invoiceNumber,
    notes: dto.notes,
    freightCents: dto.freightCents,
    discountsCents: dto.discountsCents,
    otherExpensesCents: dto.otherExpensesCents,
    lines: dto.lines,
  };
}

export class ListPurchasesQueryDto {
  @ApiPropertyOptional({ enum: PURCHASE_LIST_TABS })
  @IsOptional()
  @IsIn(PURCHASE_LIST_TABS)
  tab?: PurchaseListTab;

  @ApiPropertyOptional({ enum: PURCHASE_LIST_STATUSES })
  @IsOptional()
  @IsIn(PURCHASE_LIST_STATUSES)
  status?: PurchaseListStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  stockId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

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
