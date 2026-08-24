import type { PosDeliveryOrder } from '../domain/entities/pos-delivery-order.entity';
import {
  PosDeliveryOrderRepository,
  type ListPosDeliveryOrdersCriteria,
  type ListPosDeliveryOrdersResult,
} from '../domain/repositories/pos-delivery-order.repository.interface';

export class InMemoryPosDeliveryOrderRepository extends PosDeliveryOrderRepository {
  private storedItems: PosDeliveryOrder[] = [];
  /** deliveryOrderId → saleOrderId (venda ativa) — preenchido nos testes de checkout. */
  readonly activeSaleByDeliveryId = new Map<string, string>();

  get items(): readonly PosDeliveryOrder[] {
    return this.storedItems;
  }

  findById(organizationId: string, id: string) {
    return Promise.resolve(
      this.items.find(
        (item) =>
          item.props.organizationId === organizationId && item.id === id,
      ) ?? null,
    );
  }

  findByIdForBranch(organizationId: string, branchId: string, id: string) {
    return Promise.resolve(
      this.items.find(
        (item) =>
          item.props.organizationId === organizationId &&
          item.props.branchId === branchId &&
          item.id === id,
      ) ?? null,
    );
  }

  list(
    organizationId: string,
    branchId: string,
    criteria: ListPosDeliveryOrdersCriteria,
  ): Promise<ListPosDeliveryOrdersResult> {
    const search = criteria.search?.trim().toLowerCase();
    const filtered = this.items.filter(
      (item) =>
        item.props.organizationId === organizationId &&
        item.props.branchId === branchId &&
        (!criteria.status || item.status === criteria.status) &&
        (!criteria.fulfillment || item.fulfillment === criteria.fulfillment) &&
        (!search ||
          item.props.customerName.toLowerCase().includes(search) ||
          String(item.number).includes(search)),
    );
    return Promise.resolve({
      total: filtered.length,
      items: filtered.slice(
        (criteria.page - 1) * criteria.perPage,
        criteria.page * criteria.perPage,
      ),
    });
  }

  nextNumber(organizationId: string, branchId: string) {
    return Promise.resolve(
      Math.max(
        0,
        ...this.items
          .filter(
            (item) =>
              item.props.organizationId === organizationId &&
              item.props.branchId === branchId,
          )
          .map((item) => item.number),
      ) + 1,
    );
  }

  save(order: PosDeliveryOrder) {
    const exists = this.storedItems.some((item) => item.id === order.id);
    this.storedItems = exists
      ? this.storedItems.map((item) => (item.id === order.id ? order : item))
      : [...this.storedItems, order];
    return Promise.resolve(order);
  }

  findActiveSaleOrderIds(
    organizationId: string,
    deliveryOrderIds: string[],
  ): Promise<Map<string, string>> {
    void organizationId;
    const map = new Map<string, string>();
    for (const id of deliveryOrderIds) {
      const saleId = this.activeSaleByDeliveryId.get(id);
      if (saleId) map.set(id, saleId);
    }
    return Promise.resolve(map);
  }
}
