import { Prisma } from '../../../../generated/prisma/client';
import { StockMovement } from '../domain/entities/stock-movement.entity';
import { resolveStockBalanceStatus } from '../domain/stock-balance-status';
import {
  StockMovementRepository,
  StockProductLookup,
  type ProductStockMovementLine,
  type StockBalanceListCriteria,
  type StockBalanceListItem,
  type StockMovementDetail,
  type StockMovementListCriteria,
  type StockMovementListItem,
  type TrackableProductSnapshot,
} from '../domain/repositories/stock-movement.repository.interface';

type BalanceKey = string;

function balanceKey(stockId: string, productId: string): BalanceKey {
  return `${stockId}::${productId}`;
}

export class InMemoryStockMovementRepository extends StockMovementRepository {
  readonly movements = new Map<string, StockMovement>();
  readonly balances = new Map<BalanceKey, Prisma.Decimal>();
  meta = new Map<
    string,
    { categoryName: string | null; stockName: string; userName: string }
  >();
  productMeta = new Map<
    string,
    {
      name: string;
      sku: string;
      imageUrl: string | null;
      unit: string;
      trackStock: boolean;
    }
  >();

  setMeta(
    id: string,
    meta: { categoryName: string | null; stockName: string; userName: string },
  ) {
    this.meta.set(id, meta);
  }

  setProductMeta(
    id: string,
    meta: {
      name: string;
      sku: string;
      imageUrl?: string | null;
      unit?: string;
      trackStock?: boolean;
    },
  ) {
    this.productMeta.set(id, {
      name: meta.name,
      sku: meta.sku,
      imageUrl: meta.imageUrl ?? null,
      unit: meta.unit ?? 'un',
      trackStock: meta.trackStock ?? true,
    });
  }

  createWithBalances(movement: StockMovement): Promise<StockMovement> {
    for (const line of movement.lines) {
      const key = balanceKey(movement.stockId, line.productId);
      const available = this.balances.get(key) ?? new Prisma.Decimal(0);
      const qty = new Prisma.Decimal(line.quantity);

      // Saída pode deixar saldo negativo (paridade com persistStockMovementInTx).
      if (movement.type === 'saida') {
        this.balances.set(key, available.sub(qty));
      } else {
        this.balances.set(key, available.add(qty));
      }
    }

    this.movements.set(movement.id, movement);
    if (!this.meta.has(movement.id)) {
      this.meta.set(movement.id, {
        categoryName: movement.categoryId ? 'Categoria' : null,
        stockName: 'Estoque',
        userName: 'Operador',
      });
    }
    return Promise.resolve(movement);
  }

  findById(
    organizationId: string,
    id: string,
  ): Promise<StockMovementDetail | null> {
    const movement = this.movements.get(id);
    if (!movement || movement.organizationId !== organizationId) {
      return Promise.resolve(null);
    }
    const meta = this.meta.get(id)!;
    return Promise.resolve({
      movement,
      ...meta,
      lines: movement.lines.map((line) => {
        const product = this.productMeta.get(line.productId);
        const qty = Number(line.quantity);
        return {
          productId: line.productId,
          productName: product?.name ?? 'Produto',
          productSku: product?.sku ?? '—',
          quantity: line.quantity,
          costCents: line.costCents,
          subtotalCents: Math.round(qty * line.costCents),
        };
      }),
    });
  }

  findAll(
    organizationId: string,
    criteria: StockMovementListCriteria = {},
  ): Promise<StockMovementListItem[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(
      filtered.slice(skip, skip + take).map((movement) => ({
        movement,
        ...(this.meta.get(movement.id) ?? {
          categoryName: movement.categoryId ? 'Categoria' : null,
          stockName: 'Estoque',
          userName: 'Operador',
        }),
      })),
    );
  }

  count(
    organizationId: string,
    criteria: Omit<StockMovementListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  countByTabs(
    organizationId: string,
  ): Promise<{ all: number; entrada: number; saida: number }> {
    const all = [...this.movements.values()].filter(
      (m) => m.organizationId === organizationId,
    );
    return Promise.resolve({
      all: all.length,
      entrada: all.filter((m) => m.type === 'entrada').length,
      saida: all.filter((m) => m.type === 'saida').length,
    });
  }

  listProductMovements(
    organizationId: string,
    stockId: string,
    productId: string,
  ): Promise<ProductStockMovementLine[]> {
    const lines: ProductStockMovementLine[] = [];
    for (const movement of this.movements.values()) {
      if (
        movement.organizationId !== organizationId ||
        movement.stockId !== stockId
      ) {
        continue;
      }
      for (const line of movement.lines) {
        if (line.productId !== productId) continue;
        lines.push({
          movementId: movement.id,
          type: movement.type,
          reason: movement.reason,
          categoryName: this.meta.get(movement.id)?.categoryName ?? null,
          operatedAt: movement.operatedAt,
          quantity: line.quantity,
          costCents: line.costCents,
        });
      }
    }
    lines.sort((a, b) => b.operatedAt.getTime() - a.operatedAt.getTime());
    return Promise.resolve(lines);
  }

  listBalance(
    organizationId: string,
    stockId: string,
    criteria: StockBalanceListCriteria = {},
  ): Promise<StockBalanceListItem[]> {
    const items = this.balanceItems(organizationId, stockId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? items.length;
    return Promise.resolve(items.slice(skip, skip + take));
  }

  countBalance(
    organizationId: string,
    stockId: string,
    criteria: Omit<StockBalanceListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return Promise.resolve(
      this.balanceItems(organizationId, stockId, criteria).length,
    );
  }

  async findStockIdsWithMovementsOrBalance(
    organizationId: string,
    stockIds: string[],
  ): Promise<Set<string>> {
    const withActivity = new Set<string>();
    for (const stockId of stockIds) {
      if (await this.hasMovementsOrBalance(organizationId, stockId)) {
        withActivity.add(stockId);
      }
    }
    return withActivity;
  }

  hasMovementsOrBalance(
    organizationId: string,
    stockId: string,
  ): Promise<boolean> {
    const hasMov = [...this.movements.values()].some(
      (m) => m.organizationId === organizationId && m.stockId === stockId,
    );
    const hasBal = [...this.balances.entries()].some(([key, qty]) => {
      const [sid] = key.split('::');
      return sid === stockId && !qty.equals(0);
    });
    return Promise.resolve(hasMov || hasBal);
  }

  setBalance(
    _organizationId: string,
    stockId: string,
    productId: string,
    quantity: string,
  ) {
    this.balances.set(
      balanceKey(stockId, productId),
      new Prisma.Decimal(quantity),
    );
  }

  getBalanceQuantity(
    _organizationId: string,
    stockId: string,
    productId: string,
  ): Promise<string> {
    return Promise.resolve(
      (
        this.balances.get(balanceKey(stockId, productId)) ??
        new Prisma.Decimal(0)
      ).toString(),
    );
  }

  getBalancesForStockProducts(
    _organizationId: string,
    stockId: string,
    productIds: string[],
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const id of productIds) {
      result.set(
        id,
        (
          this.balances.get(balanceKey(stockId, id)) ?? new Prisma.Decimal(0)
        ).toString(),
      );
    }
    return Promise.resolve(result);
  }

  /** stockId → branchIds vinculados (para sumQuantities com branchId). */
  stockBranches = new Map<string, Set<string>>();

  linkStockToBranch(stockId: string, branchId: string) {
    const set = this.stockBranches.get(stockId) ?? new Set<string>();
    set.add(branchId);
    this.stockBranches.set(stockId, set);
  }

  sumQuantitiesByProductIds(
    _organizationId: string,
    productIds: string[],
    options?: { branchId?: string },
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    for (const id of productIds) result.set(id, 0);

    const branchId = options?.branchId?.trim() || undefined;

    for (const [key, qty] of this.balances.entries()) {
      const [stockId, productId] = key.split('::');
      if (!productId || !result.has(productId)) continue;
      if (branchId) {
        const branches = this.stockBranches.get(stockId);
        if (!branches?.has(branchId)) continue;
      }
      result.set(productId, (result.get(productId) ?? 0) + Number(qty));
    }

    return Promise.resolve(result);
  }

  private filter(
    organizationId: string,
    criteria: Omit<StockMovementListCriteria, 'skip' | 'take'>,
  ): StockMovement[] {
    const search = criteria.search?.trim().toLowerCase();
    const tab =
      criteria.tab && criteria.tab !== 'all' ? criteria.tab : undefined;

    return [...this.movements.values()]
      .filter((m) => m.organizationId === organizationId)
      .filter((m) => (tab ? m.type === tab : true))
      .filter((m) => (criteria.reason ? m.reason === criteria.reason : true))
      .filter((m) => {
        if (!search) return true;
        const meta = this.meta.get(m.id);
        return (
          m.id.toLowerCase().includes(search) ||
          meta?.categoryName?.toLowerCase().includes(search) ||
          meta?.stockName.toLowerCase().includes(search) ||
          m.lines.some((line) => {
            const product = this.productMeta.get(line.productId);
            return (
              product?.name.toLowerCase().includes(search) ||
              product?.sku.toLowerCase().includes(search)
            );
          })
        );
      })
      .sort((a, b) => b.operatedAt.getTime() - a.operatedAt.getTime());
  }

  private balanceItems(
    organizationId: string,
    stockId: string,
    criteria: Omit<StockBalanceListCriteria, 'skip' | 'take'>,
  ): StockBalanceListItem[] {
    const search = criteria.search?.trim().toLowerCase();
    const items: StockBalanceListItem[] = [];

    for (const [key, qty] of this.balances.entries()) {
      const [sid, productId] = key.split('::');
      if (sid !== stockId) continue;
      const product = this.productMeta.get(productId);
      if (!product?.trackStock) continue;
      if (
        search &&
        !product.name.toLowerCase().includes(search) &&
        !product.sku.toLowerCase().includes(search)
      ) {
        continue;
      }
      const quantity = qty.toString();
      const status = resolveStockBalanceStatus(Number(quantity));
      if (criteria.status && status !== criteria.status) continue;
      items.push({
        productId,
        productName: product.name,
        productSku: product.sku,
        hasProductImage:
          product.imageUrl !== null && product.imageUrl.length > 0,
        quantity,
        unit: product.unit,
        status,
      });
    }

    return items.sort((a, b) =>
      a.productName.localeCompare(b.productName, 'pt-BR'),
    );
  }
}

export class InMemoryStockProductLookup extends StockProductLookup {
  readonly products = new Map<string, TrackableProductSnapshot>();

  set(product: TrackableProductSnapshot) {
    this.products.set(product.id, product);
  }

  findTrackable(
    _organizationId: string,
    productId: string,
  ): Promise<TrackableProductSnapshot | null> {
    return Promise.resolve(this.products.get(productId) ?? null);
  }

  findTrackableMany(
    _organizationId: string,
    productIds: string[],
  ): Promise<Map<string, TrackableProductSnapshot>> {
    const byId = new Map<string, TrackableProductSnapshot>();
    for (const id of productIds) {
      const product = this.products.get(id);
      if (product) byId.set(id, product);
    }
    return Promise.resolve(byId);
  }
}
