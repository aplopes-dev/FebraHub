import { ProductionOrder } from '../domain/entities/production-order.entity';
import { ProductionHistoryEntry } from '../domain/entities/production-history-entry.entity';
import {
  ProductionOrderRepository,
  type ProductionOrderListCriteria,
  type ProductionOrderListRow,
  type ProductionOrderTabCounts,
} from '../domain/repositories/production-order.repository.interface';
import type { StockMovement } from '../domain/entities/stock-movement.entity';
import { InMemoryStockMovementRepository } from './in-memory-stock-movement.repository';

export class InMemoryProductionOrderRepository extends ProductionOrderRepository {
  readonly orders = new Map<string, ProductionOrder>();
  readonly history = new Map<string, ProductionHistoryEntry[]>();
  productNames = new Map<string, string>();
  productSkus = new Map<string, string>();
  stockNames = new Map<string, string>();

  constructor(
    private readonly stockMovementRepository?: InMemoryStockMovementRepository,
  ) {
    super();
  }

  setProductMeta(id: string, meta: { name: string; sku: string }) {
    this.productNames.set(id, meta.name);
    this.productSkus.set(id, meta.sku);
  }

  setStockName(id: string, name: string) {
    this.stockNames.set(id, name);
  }

  create(
    order: ProductionOrder,
    historyEntry: ProductionHistoryEntry,
  ): Promise<ProductionOrder> {
    this.orders.set(order.id, order);
    this.pushHistory(order.id, historyEntry);
    return Promise.resolve(order);
  }

  save(
    order: ProductionOrder,
    historyEntry?: ProductionHistoryEntry,
  ): Promise<ProductionOrder> {
    this.orders.set(order.id, order);
    if (historyEntry) this.pushHistory(order.id, historyEntry);
    return Promise.resolve(order);
  }

  async finalizeWithMovements(
    order: ProductionOrder,
    outbound: StockMovement | null,
    inbound: StockMovement,
    historyEntry: ProductionHistoryEntry,
  ): Promise<ProductionOrder | null> {
    // Espelha o UPDATE condicional do repositório Prisma: só grava se a ordem
    // ainda estiver pendente/em andamento.
    const current = this.orders.get(order.id);
    if (
      !current ||
      (current.status !== 'pending' && current.status !== 'in_progress')
    ) {
      return null;
    }

    if (this.stockMovementRepository) {
      if (outbound) {
        await this.stockMovementRepository.createWithBalances(outbound);
      }
      await this.stockMovementRepository.createWithBalances(inbound);
    }
    this.orders.set(order.id, order);
    this.pushHistory(order.id, historyEntry);
    return order;
  }

  findById(
    organizationId: string,
    id: string,
  ): Promise<ProductionOrder | null> {
    const order = this.orders.get(id);
    return Promise.resolve(
      order && order.organizationId === organizationId ? order : null,
    );
  }

  findAll(
    organizationId: string,
    criteria: ProductionOrderListCriteria = {},
  ): Promise<ProductionOrderListRow[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(
      filtered.slice(skip, skip + take).map((order) => this.toRow(order)),
    );
  }

  count(
    organizationId: string,
    criteria: Omit<ProductionOrderListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  countByTabs(organizationId: string): Promise<ProductionOrderTabCounts> {
    const all = [...this.orders.values()].filter(
      (order) => order.organizationId === organizationId,
    );
    return Promise.resolve({
      all: all.length,
      pending: all.filter((order) => order.status === 'pending').length,
      in_progress: all.filter((order) => order.status === 'in_progress').length,
      completed: all.filter((order) => order.status === 'completed').length,
      cancelled: all.filter((order) => order.status === 'cancelled').length,
    });
  }

  listHistory(
    organizationId: string,
    orderId: string,
  ): Promise<ProductionHistoryEntry[]> {
    const entries = (this.history.get(orderId) ?? []).filter(
      (entry) => entry.organizationId === organizationId,
    );
    return Promise.resolve(
      [...entries].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      ),
    );
  }

  addHistory(
    _organizationId: string,
    orderId: string,
    entry: ProductionHistoryEntry,
  ): Promise<ProductionHistoryEntry> {
    this.pushHistory(orderId, entry);
    return Promise.resolve(entry);
  }

  private pushHistory(orderId: string, entry: ProductionHistoryEntry) {
    const list = this.history.get(orderId) ?? [];
    list.push(entry);
    this.history.set(orderId, list);
  }

  private toRow(order: ProductionOrder): ProductionOrderListRow {
    return {
      order,
      productName: this.productNames.get(order.productId) ?? 'Produto',
      productSku: this.productSkus.get(order.productId) ?? '—',
      sourceStockName: this.stockNames.get(order.sourceStockId) ?? 'Estoque',
      destinationStockName:
        this.stockNames.get(order.destinationStockId) ?? 'Estoque',
    };
  }

  private filter(
    organizationId: string,
    criteria: Omit<ProductionOrderListCriteria, 'skip' | 'take'>,
  ): ProductionOrder[] {
    const search = criteria.search?.trim().toLowerCase();
    const tab =
      criteria.tab && criteria.tab !== 'all' ? criteria.tab : undefined;

    return [...this.orders.values()]
      .filter((order) => order.organizationId === organizationId)
      .filter((order) => (tab ? order.status === tab : true))
      .filter((order) => {
        if (!search) return true;
        const productName = (
          this.productNames.get(order.productId) ?? ''
        ).toLowerCase();
        const productSku = (
          this.productSkus.get(order.productId) ?? ''
        ).toLowerCase();
        return (
          order.id.toLowerCase().includes(search) ||
          productName.includes(search) ||
          productSku.includes(search)
        );
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  clear(): void {
    this.orders.clear();
    this.history.clear();
    this.productNames.clear();
    this.productSkus.clear();
    this.stockNames.clear();
  }
}
