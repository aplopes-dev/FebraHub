import { Purchase } from '../domain/entities/purchase.entity';
import type { StockMovement } from '../domain/entities/stock-movement.entity';
import {
  PurchaseRepository,
  type PurchaseDetail,
  type PurchaseListCriteria,
  type PurchaseListItem,
} from '../domain/repositories/purchase.repository.interface';
import { InMemoryStockMovementRepository } from './in-memory-stock-movement.repository';

export class InMemoryPurchaseRepository extends PurchaseRepository {
  readonly purchases = new Map<string, Purchase>();
  stockNames = new Map<string, string>();
  supplierNames = new Map<string, string>();
  carrierNames = new Map<string, string>();
  productMeta = new Map<string, { name: string; sku: string }>();

  constructor(
    private readonly stockMovementRepository?: InMemoryStockMovementRepository,
  ) {
    super();
  }

  setStockName(id: string, name: string) {
    this.stockNames.set(id, name);
  }
  setSupplierName(id: string, name: string) {
    this.supplierNames.set(id, name);
  }
  setCarrierName(id: string, name: string) {
    this.carrierNames.set(id, name);
  }
  setProductMeta(id: string, meta: { name: string; sku: string }) {
    this.productMeta.set(id, meta);
  }

  async saveWithOptionalMovement(
    purchase: Purchase,
    movement: StockMovement | null,
  ): Promise<Purchase> {
    const finalPurchase = movement
      ? purchase.withStockMovementId(movement.id)
      : purchase;

    if (movement && this.stockMovementRepository) {
      await this.stockMovementRepository.createWithBalances(movement);
    }

    this.purchases.set(finalPurchase.id, finalPurchase);
    return finalPurchase;
  }

  softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    const purchase = this.purchases.get(id);
    if (purchase && purchase.organizationId === organizationId) {
      this.purchases.set(
        id,
        Purchase.with({ ...purchase.props, deletedAt }, id),
      );
    }
    return Promise.resolve();
  }

  clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    const purchase = this.purchases.get(id);
    if (purchase && purchase.organizationId === organizationId) {
      this.purchases.set(
        id,
        Purchase.with({ ...purchase.props, deletedAt: null, updatedAt }, id),
      );
    }
    return Promise.resolve();
  }

  findById(organizationId: string, id: string): Promise<PurchaseDetail | null> {
    const purchase = this.purchases.get(id);
    if (!purchase || purchase.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      purchase,
      stockName: this.stockNames.get(purchase.stockId) ?? 'Estoque',
      supplierName: this.supplierNames.get(purchase.supplierId) ?? 'Fornecedor',
      carrierName: purchase.carrierId
        ? (this.carrierNames.get(purchase.carrierId) ?? 'Transportadora')
        : null,
      lines: purchase.lines.map((line) => {
        const meta = this.productMeta.get(line.productId);
        return {
          productId: line.productId,
          productName: meta?.name ?? 'Produto',
          productSku: meta?.sku ?? '—',
          quantity: line.quantity,
          costCents: line.costCents,
          status: line.status,
        };
      }),
    });
  }

  findAll(
    organizationId: string,
    criteria: PurchaseListCriteria = {},
  ): Promise<PurchaseListItem[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(
      filtered.slice(skip, skip + take).map((purchase) => ({
        purchase,
        stockName: this.stockNames.get(purchase.stockId) ?? 'Estoque',
        supplierName:
          this.supplierNames.get(purchase.supplierId) ?? 'Fornecedor',
        carrierName: purchase.carrierId
          ? (this.carrierNames.get(purchase.carrierId) ?? 'Transportadora')
          : null,
      })),
    );
  }

  count(
    organizationId: string,
    criteria: Omit<PurchaseListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  countByTabs(
    organizationId: string,
  ): Promise<{ active: number; deleted: number }> {
    const all = [...this.purchases.values()].filter(
      (p) => p.organizationId === organizationId,
    );
    return Promise.resolve({
      active: all.filter((p) => !p.deletedAt).length,
      deleted: all.filter((p) => p.deletedAt).length,
    });
  }

  private filter(
    organizationId: string,
    criteria: Omit<PurchaseListCriteria, 'skip' | 'take'>,
  ): Purchase[] {
    const search = criteria.search?.trim().toLowerCase();
    const tab = criteria.tab ?? 'active';

    return [...this.purchases.values()]
      .filter((p) => p.organizationId === organizationId)
      .filter((p) => (tab === 'deleted' ? p.deletedAt : !p.deletedAt))
      .filter((p) =>
        criteria.status && criteria.status !== 'all'
          ? p.deliveryStatus === criteria.status
          : true,
      )
      .filter((p) => (criteria.stockId ? p.stockId === criteria.stockId : true))
      .filter((p) =>
        criteria.supplierId ? p.supplierId === criteria.supplierId : true,
      )
      .filter((p) =>
        criteria.dateFrom ? p.purchasedAt >= criteria.dateFrom : true,
      )
      .filter((p) =>
        criteria.dateTo ? p.purchasedAt <= criteria.dateTo : true,
      )
      .filter((p) => {
        if (!search) return true;
        const supplierName = (
          this.supplierNames.get(p.supplierId) ?? ''
        ).toLowerCase();
        return (
          p.invoiceNumber.toLowerCase().includes(search) ||
          p.series.toLowerCase().includes(search) ||
          supplierName.includes(search) ||
          p.lines.some((line) => {
            const meta = this.productMeta.get(line.productId);
            return (
              meta?.name.toLowerCase().includes(search) ||
              meta?.sku.toLowerCase().includes(search)
            );
          })
        );
      })
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
  }

  clear(): void {
    this.purchases.clear();
    this.stockNames.clear();
    this.supplierNames.clear();
    this.carrierNames.clear();
    this.productMeta.clear();
  }
}
