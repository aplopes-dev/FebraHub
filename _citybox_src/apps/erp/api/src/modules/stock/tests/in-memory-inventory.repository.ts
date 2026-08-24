import { Prisma } from '../../../../generated/prisma/client';
import { Inventory } from '../domain/entities/inventory.entity';
import type { StockMovement } from '../domain/entities/stock-movement.entity';
import {
  InventoryRepository,
  type InventoryDetail,
  type InventoryLineDetail,
  type InventoryListCriteria,
  type InventoryListItem,
} from '../domain/repositories/inventory.repository.interface';
import { InMemoryStockMovementRepository } from './in-memory-stock-movement.repository';

export class InMemoryInventoryRepository extends InventoryRepository {
  readonly inventories = new Map<string, Inventory>();
  productMeta = new Map<string, { name: string; sku: string; unit: string }>();

  constructor(
    private readonly stockMovementRepository?: InMemoryStockMovementRepository,
  ) {
    super();
  }

  setProductMeta(
    id: string,
    meta: { name: string; sku: string; unit?: string },
  ) {
    this.productMeta.set(id, {
      name: meta.name,
      sku: meta.sku,
      unit: meta.unit ?? 'un',
    });
  }

  async createCompletedWithAdjustments(
    inventory: Inventory,
    adjustments: StockMovement[],
  ): Promise<Inventory> {
    this.inventories.set(inventory.id, inventory);
    if (this.stockMovementRepository) {
      for (const movement of adjustments) {
        await this.stockMovementRepository.createWithBalances(movement);
      }
    }
    return inventory;
  }

  findById(
    organizationId: string,
    id: string,
  ): Promise<InventoryDetail | null> {
    const inventory = this.inventories.get(id);
    if (!inventory || inventory.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      inventory,
      lines: inventory.lines.map((line) => this.toLineDetail(line)),
    });
  }

  findAll(
    organizationId: string,
    criteria: InventoryListCriteria,
  ): Promise<InventoryListItem[]> {
    const filtered = [...this.inventories.values()]
      .filter(
        (inv) =>
          inv.organizationId === organizationId &&
          inv.stockId === criteria.stockId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(
      filtered.slice(skip, skip + take).map((inventory) => ({
        inventory,
        itemsCount: inventory.itemsCount,
        divergentCount: inventory.divergentCount,
      })),
    );
  }

  count(
    organizationId: string,
    criteria: Pick<InventoryListCriteria, 'stockId'>,
  ): Promise<number> {
    return Promise.resolve(
      [...this.inventories.values()].filter(
        (inv) =>
          inv.organizationId === organizationId &&
          inv.stockId === criteria.stockId,
      ).length,
    );
  }

  private toLineDetail(line: {
    productId: string;
    systemQuantity: string;
    countedQuantity: string;
  }): InventoryLineDetail {
    const meta = this.productMeta.get(line.productId);
    return {
      productId: line.productId,
      productName: meta?.name ?? 'Produto',
      productSku: meta?.sku ?? '—',
      unit: meta?.unit ?? 'un',
      systemQuantity: line.systemQuantity,
      countedQuantity: line.countedQuantity,
    };
  }

  /** Helper de teste: seed de saldo via Decimal. */
  seedBalance(
    repo: InMemoryStockMovementRepository,
    stockId: string,
    productId: string,
    quantity: string,
  ) {
    repo.balances.set(`${stockId}::${productId}`, new Prisma.Decimal(quantity));
  }

  clear(): void {
    this.inventories.clear();
    this.productMeta.clear();
  }
}
