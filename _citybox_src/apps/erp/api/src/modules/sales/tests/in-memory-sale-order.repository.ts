import { SaleOrder } from '../domain/entities/sale-order.entity';
import type { StockMovement } from '../../stock/domain/entities/stock-movement.entity';
import {
  SaleOrderRepository,
  type SaleOrderDetail,
  type SaleOrderListCriteria,
  type SaleOrderListItem,
  type SaveSaleOrderPosMeta,
} from '../domain/repositories/sale-order.repository.interface';
import { InMemoryStockMovementRepository } from '../../stock/tests/in-memory-stock-movement.repository';
import type { InMemoryPosDeliveryOrderRepository } from '../../pos-delivery/tests/in-memory-pos-delivery-order.repository';
import { AlreadySoldError } from '../../pos-delivery/domain/errors/pos-delivery.errors';

export class InMemorySaleOrderRepository extends SaleOrderRepository {
  readonly saleOrders = new Map<string, SaleOrder>();
  /** Metadados POS gravados no create (asserts de teste). */
  readonly posMetaBySaleId = new Map<string, SaveSaleOrderPosMeta>();
  stockNames = new Map<string, string>();
  productMeta = new Map<string, { name: string; sku: string }>();

  constructor(
    private readonly stockMovementRepository?: InMemoryStockMovementRepository,
    private readonly deliveryOrderRepository?: InMemoryPosDeliveryOrderRepository,
  ) {
    super();
  }

  setStockName(id: string, name: string) {
    this.stockNames.set(id, name);
  }

  setProductMeta(id: string, meta: { name: string; sku: string }) {
    this.productMeta.set(id, meta);
  }

  nextNumber(organizationId: string): Promise<number> {
    const max = [...this.saleOrders.values()]
      .filter((order) => order.organizationId === organizationId)
      .reduce((acc, order) => Math.max(acc, order.number), 0);
    return Promise.resolve(max + 1);
  }

  async saveWithOptionalMovement(
    saleOrder: SaleOrder,
    movement: StockMovement | null,
    posMeta?: SaveSaleOrderPosMeta,
  ): Promise<SaleOrder> {
    const finalOrder = movement
      ? saleOrder.withStockMovementId(movement.id)
      : saleOrder;

    if (movement && this.stockMovementRepository) {
      await this.stockMovementRepository.createWithBalances(movement);
    }

    if (posMeta) {
      this.posMetaBySaleId.set(finalOrder.id, posMeta);
      if (posMeta.posDeliveryOrderId && this.deliveryOrderRepository) {
        const order = await this.deliveryOrderRepository.findById(
          finalOrder.organizationId,
          posMeta.posDeliveryOrderId,
        );
        if (!order || order.status === 'cancelled') {
          throw new AlreadySoldError();
        }
        const existing =
          this.deliveryOrderRepository.activeSaleByDeliveryId.get(
            posMeta.posDeliveryOrderId,
          );
        if (existing) {
          throw new AlreadySoldError();
        }
        this.deliveryOrderRepository.activeSaleByDeliveryId.set(
          posMeta.posDeliveryOrderId,
          finalOrder.id,
        );
      }
    }

    this.saleOrders.set(finalOrder.id, finalOrder);
    return finalOrder;
  }

  softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    const saleOrder = this.saleOrders.get(id);
    if (saleOrder && saleOrder.organizationId === organizationId) {
      this.saleOrders.set(
        id,
        SaleOrder.with({ ...saleOrder.props, deletedAt }, id),
      );
    }
    return Promise.resolve();
  }

  clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    const saleOrder = this.saleOrders.get(id);
    if (saleOrder && saleOrder.organizationId === organizationId) {
      this.saleOrders.set(
        id,
        SaleOrder.with({ ...saleOrder.props, deletedAt: null, updatedAt }, id),
      );
    }
    return Promise.resolve();
  }

  findById(
    organizationId: string,
    id: string,
  ): Promise<SaleOrderDetail | null> {
    const saleOrder = this.saleOrders.get(id);
    if (!saleOrder || saleOrder.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      saleOrder,
      stockName: saleOrder.stockId
        ? (this.stockNames.get(saleOrder.stockId) ?? 'Estoque')
        : null,
      posDeliveryOrderId:
        this.posMetaBySaleId.get(id)?.posDeliveryOrderId ?? null,
      posDeliveryOrderNumber: null,
      posDeliveryFulfillment: null,
      lines: saleOrder.lines.map((line) => {
        const meta = line.productId
          ? this.productMeta.get(line.productId)
          : undefined;
        const qty = Number(line.quantity);
        return {
          productId: line.productId,
          productName: line.productId ? (meta?.name ?? 'Produto') : null,
          productSku: line.productId ? (meta?.sku ?? '—') : null,
          description: line.description,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          subtotalCents: Math.round(qty * line.unitPriceCents),
        };
      }),
    });
  }

  findAll(
    organizationId: string,
    criteria: SaleOrderListCriteria = {},
  ): Promise<SaleOrderListItem[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(
      filtered.slice(skip, skip + take).map((saleOrder) => ({
        saleOrder,
        stockName: saleOrder.stockId
          ? (this.stockNames.get(saleOrder.stockId) ?? 'Estoque')
          : null,
      })),
    );
  }

  count(
    organizationId: string,
    criteria: Omit<SaleOrderListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  countByTabs(
    organizationId: string,
  ): Promise<{ open: number; deleted: number }> {
    const all = [...this.saleOrders.values()].filter(
      (order) => order.organizationId === organizationId,
    );
    return Promise.resolve({
      open: all.filter((order) => !order.deletedAt).length,
      deleted: all.filter((order) => order.deletedAt).length,
    });
  }

  private filter(
    organizationId: string,
    criteria: Omit<SaleOrderListCriteria, 'skip' | 'take'>,
  ): SaleOrder[] {
    const search = criteria.search?.trim().toLowerCase();
    const tab = criteria.tab ?? 'open';

    let list = [...this.saleOrders.values()]
      .filter((order) => order.organizationId === organizationId)
      .filter((order) =>
        tab === 'deleted' ? order.deletedAt : !order.deletedAt,
      )
      .filter((order) =>
        criteria.statuses?.length
          ? criteria.statuses.includes(order.status)
          : true,
      )
      .filter((order) =>
        criteria.channelId ? order.channelId === criteria.channelId : true,
      )
      .filter((order) =>
        criteria.amountMinCents !== undefined
          ? order.totalCents >= criteria.amountMinCents
          : true,
      )
      .filter((order) =>
        criteria.amountMaxCents !== undefined
          ? order.totalCents <= criteria.amountMaxCents
          : true,
      )
      .filter((order) =>
        criteria.dateFrom ? order.createdAt >= criteria.dateFrom : true,
      )
      .filter((order) =>
        criteria.dateTo ? order.createdAt <= criteria.dateTo : true,
      )
      .filter((order) =>
        search ? order.customerName.toLowerCase().includes(search) : true,
      );

    list = this.sort(list, criteria.sort);
    return list;
  }

  private sort(
    list: SaleOrder[],
    sort: SaleOrderListCriteria['sort'],
  ): SaleOrder[] {
    const sorted = [...list];
    switch (sort) {
      case 'created_at_asc':
        sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'amount_desc':
        sorted.sort((a, b) => b.totalCents - a.totalCents);
        break;
      case 'amount_asc':
        sorted.sort((a, b) => a.totalCents - b.totalCents);
        break;
      case 'number_asc':
        sorted.sort((a, b) => a.number - b.number);
        break;
      case 'number_desc':
        sorted.sort((a, b) => b.number - a.number);
        break;
      default:
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return sorted;
  }

  clear(): void {
    this.saleOrders.clear();
    this.posMetaBySaleId.clear();
    this.stockNames.clear();
    this.productMeta.clear();
  }
}
