import type {
  SaleOrderLineDto,
  SaleOrderPaymentDto,
} from '../../../sales/application/dtos/sale-order.dto';

export type CreatePosSaleLineDto = SaleOrderLineDto;

export type CreatePosSalePaymentDto = SaleOrderPaymentDto;

export type CreatePosSaleDto = {
  organizationId: string;
  branchId: string;
  /** Terminal DeviceAuth que originou a venda. */
  posTerminalId: string;
  /** Pedido operacional de delivery que será encerrado neste checkout. */
  posDeliveryOrderId?: string;
  operatorId: string;
  customerId?: string | null;
  customerName?: string;
  consumerDocument?: string | null;
  sellerId?: string | null;
  sellerName?: string;
  notes?: string;
  deliveryFeeCents?: number;
  discountsCents?: number;
  /** Supervisor que autorizou desconto acima da alçada (userId). */
  discountAuthorizedByUserId?: string | null;
  lines: CreatePosSaleLineDto[];
  payments: CreatePosSalePaymentDto[];
};
