import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
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
import { MAX_PER_PAGE } from '../../../tenancy/application/pagination';
import { SaleOrderPaymentHttpDto } from '../../infrastructure/http/routes/shared/sale-order.dto';

export const SERVICE_ORDER_BASE_TYPES = [
  'open',
  'in_progress',
  'ready',
  'closed',
  'canceled',
] as const;
export type ServiceOrderBaseType = (typeof SERVICE_ORDER_BASE_TYPES)[number];

export const SERVICE_ORDER_APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;
export type ServiceOrderApprovalStatus =
  (typeof SERVICE_ORDER_APPROVAL_STATUSES)[number];

export const SERVICE_ORDER_STATUS_VARIANTS = [
  'default',
  'secondary',
  'outline',
  'destructive',
] as const;
export type ServiceOrderStatusVariant =
  (typeof SERVICE_ORDER_STATUS_VARIANTS)[number];

export class ServiceOrderWritableHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  customerName!: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @ApiProperty()
  @IsUUID()
  statusId!: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  sellerName?: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  technicianName?: string;

  @ApiProperty({ example: '2026-07-30T12:00:00.000Z' })
  @IsDateString()
  openedAt!: string;

  @ApiPropertyOptional({ example: '2026-08-05T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalCents?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetedCents?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  diagnosisFeeCents?: number;

  @ApiPropertyOptional({ enum: SERVICE_ORDER_APPROVAL_STATUSES })
  @IsOptional()
  @IsIn(SERVICE_ORDER_APPROVAL_STATUSES)
  approvalStatus?: ServiceOrderApprovalStatus;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  approvalNotes?: string;

  @ApiPropertyOptional({
    description:
      'Equipamentos e linhas do serviço (livre) — `lines` (opcional) alimenta o generate-sale: [{productId, quantity, unitPriceCents}]',
  })
  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;
}

/**
 * Bugfix (2026-08-20, achado em teste manual): gerar venda a partir de uma
 * OS fechava o `SaleOrder` sem nenhum pagamento — o "motor de recebíveis"
 * (`maybeCreateReceivable`) só cria `FinancialEntry` quando há pagamentos,
 * então nenhum lançamento de fornecimento de serviço era gerado. O diálogo
 * "Receber e gerar venda" já coletava os recebimentos no cliente, só não os
 * enviava. Reaproveita `SaleOrderPaymentHttpDto` do módulo `sales` — mesmo
 * contrato do `POST /v1/sale-orders`.
 */
export class GenerateSaleHttpDto {
  @ApiPropertyOptional({ type: [SaleOrderPaymentHttpDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleOrderPaymentHttpDto)
  payments?: SaleOrderPaymentHttpDto[];
}

export class ListServiceOrdersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  statusId?: string;

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

export class ServiceOrderStatusWritableHttpDto {
  @ApiProperty({ maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ enum: SERVICE_ORDER_BASE_TYPES })
  @IsIn(SERVICE_ORDER_BASE_TYPES)
  baseType!: ServiceOrderBaseType;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    enum: SERVICE_ORDER_STATUS_VARIANTS,
    description:
      'Token de cor do badge no frontend — só estilo, sem regra de negócio.',
  })
  @IsOptional()
  @IsIn(SERVICE_ORDER_STATUS_VARIANTS)
  variant?: ServiceOrderStatusVariant;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
