import type {
  PosDeliveryFulfillment,
  PosDeliveryOrder,
  PosDeliveryOrderStatus,
} from '../entities/pos-delivery-order.entity';

export type ListPosDeliveryOrdersCriteria = {
  status?: PosDeliveryOrderStatus;
  fulfillment?: PosDeliveryFulfillment;
  search?: string;
  page: number;
  perPage: number;
};

export type ListPosDeliveryOrdersResult = {
  items: PosDeliveryOrder[];
  total: number;
};

export abstract class PosDeliveryOrderRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<PosDeliveryOrder | null>;

  abstract findByIdForBranch(
    organizationId: string,
    branchId: string,
    id: string,
  ): Promise<PosDeliveryOrder | null>;

  abstract list(
    organizationId: string,
    branchId: string,
    criteria: ListPosDeliveryOrdersCriteria,
  ): Promise<ListPosDeliveryOrdersResult>;

  abstract nextNumber(
    organizationId: string,
    branchId: string,
  ): Promise<number>;

  abstract save(order: PosDeliveryOrder): Promise<PosDeliveryOrder>;

  /**
   * Mapa deliveryOrderId → saleOrderId da venda ativa (status <> cancelled).
   * Pedidos sem venda ativa não entram no mapa.
   */
  abstract findActiveSaleOrderIds(
    organizationId: string,
    deliveryOrderIds: string[],
  ): Promise<Map<string, string>>;
}
