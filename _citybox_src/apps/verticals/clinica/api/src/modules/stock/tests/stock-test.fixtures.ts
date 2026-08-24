import { InMemoryObjectStorage } from '../../../shared/infra/storage/in-memory-object-storage';
import { StockProduct } from '../domain/entities/stock-product.entity';
import type {
  StockProductListCriteria,
  StockProductListItem,
  StockSupplierInfo,
} from '../domain/repositories/stock-product.repository';
import { StockProductRepository } from '../domain/repositories/stock-product.repository';
import { StockInsufficientQuantityError } from '../domain/errors/stock-insufficient-quantity.error';
import { StockProductNotFoundError } from '../domain/errors/stock-product-not-found.error';
import {
  StockMovementRepository,
  type StockMovementListCriteria,
  type StockMovementListItem,
} from '../domain/repositories/stock-movement.repository';
import type { StockMovementType } from '../domain/stock-types';
import type { StockStatus } from '../domain/stock-types';
import { calculateStockStatus } from '../domain/utils/stock-status.utils';

type StoreId = string;

function makePngBuffer(): Buffer {
  // Assinatura PNG + alguns bytes arbitrários (o ImageFileValidator só checa a assinatura).
  return Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // chunk-ish
  ]);
}

export { InMemoryObjectStorage, makePngBuffer };

export class InMemoryStockProductRepository extends StockProductRepository {
  private readonly products = new Map<string, StockProduct>();

  private key(storeId: StoreId, productId: string): string {
    return `${storeId}::${productId}`;
  }

  async findById(storeId: string, id: string): Promise<StockProduct | null> {
    return this.products.get(this.key(storeId, id)) ?? null;
  }

  async findBySearch(
    storeId: string,
    criteria: StockProductListCriteria,
  ): Promise<{
    items: StockProductListItem[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    // Para os testes atuais, não precisamos de busca. Implementamos um mínimo.
    const page = criteria.page ?? 1;
    const perPage = criteria.perPage ?? 20;
    const all = [...this.products.values()].filter(
      (p) => p.storeId === storeId,
    );

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const skip = (page - 1) * perPage;

    const items: StockProductListItem[] = all
      .slice(skip, skip + perPage)
      .map((p) => {
        const unitCost = p.unitCostCents / 100;
        const activeValue = p.quantity * unitCost;
        const status: StockStatus = calculateStockStatus(
          p.quantity,
          p.minQuantity,
        );
        const photoUrl = p.photoObjectKey
          ? `/api/v1/stock-products/${p.id}/photo`
          : null;

        const supplier: StockSupplierInfo | null = p.supplierId
          ? { id: p.supplierId, name: 'Fornecedor' }
          : null;

        return {
          id: p.id,
          storeId: p.storeId,
          name: p.name,
          category: p.category,
          sku: p.sku,
          supplierId: p.supplierId,
          supplier,
          photoUrl,
          quantity: p.quantity,
          minQuantity: p.minQuantity,
          unitCost,
          activeValue,
          status,
        };
      });

    return { items, total, page, perPage, totalPages };
  }

  async create(product: StockProduct): Promise<StockProduct> {
    this.products.set(this.key(product.storeId, product.id), product);
    return product;
  }

  async save(product: StockProduct): Promise<StockProduct> {
    this.products.set(this.key(product.storeId, product.id), product);
    return product;
  }

  async updatePhoto(
    storeId: string,
    productId: string,
    objectKey: string,
    mimeType: string,
  ): Promise<StockProduct> {
    const product = await this.findById(storeId, productId);
    if (!product) throw new StockProductNotFoundError('InMemory', productId);
    product.setPhoto(objectKey, mimeType);
    return this.save(product);
  }

  async clearPhoto(storeId: string, productId: string): Promise<void> {
    const product = await this.findById(storeId, productId);
    if (!product) throw new StockProductNotFoundError('InMemory', productId);
    product.clearPhoto();
    await this.save(product);
  }

  async delete(storeId: string, productId: string): Promise<void> {
    this.products.delete(this.key(storeId, productId));
  }

  async getStats(storeId: string): Promise<{
    totalValue: number;
    totalProducts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }> {
    const all = [...this.products.values()].filter(
      (p) => p.storeId === storeId,
    );
    const totalValue = all.reduce(
      (sum, p) => sum + p.quantity * (p.unitCostCents / 100),
      0,
    );
    const inStock = all.filter((p) => p.quantity > p.minQuantity).length;
    const outOfStock = all.filter((p) => p.quantity <= 0).length;
    const lowStock = all.filter(
      (p) => p.quantity > 0 && p.quantity <= p.minQuantity,
    ).length;
    return {
      totalValue,
      totalProducts: all.length,
      inStock,
      lowStock,
      outOfStock,
    };
  }

  // Helpers do harness
  seedProduct(product: StockProduct) {
    this.products.set(this.key(product.storeId, product.id), product);
  }
}

export class InMemoryStockMovementRepository extends StockMovementRepository {
  private readonly movements: Array<
    StockMovementListItem & { storeId: string }
  > = [];

  constructor(
    private readonly productRepository: InMemoryStockProductRepository,
  ) {
    super();
  }

  async createEntry(input: {
    storeId: string;
    productId: string;
    quantity: number;
    notes: string | null;
    authorizedById: string;
    authorizedByName: string;
  }): Promise<void> {
    const product = await this.productRepository.findById(
      input.storeId,
      input.productId,
    );
    if (!product) {
      throw new StockProductNotFoundError('InMemory', input.productId);
    }
    const nextQuantity = product.quantity + input.quantity;
    product.applyEntry(input.quantity);
    await this.productRepository.save(product);

    this.movements.unshift({
      id: `mov-${this.movements.length + 1}`,
      type: 'entry',
      quantity: input.quantity,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      product: {
        id: product.id,
        name: product.name,
        photoUrl: product.photoObjectKey
          ? `/api/v1/stock-products/${product.id}/photo`
          : null,
      },
      requestedBy: null,
      authorizedBy: { id: input.authorizedById, name: input.authorizedByName },
      storeId: input.storeId,
    });
  }

  async createBulkEntry(input: {
    storeId: string;
    items: Array<{ productId: string; quantity: number }>;
    notesByProductId?: Record<string, string | null>;
    authorizedById: string;
    authorizedByName: string;
  }): Promise<void> {
    // “Transação”: se algum produto falhar, nada muda.
    const snapshot = new Map<string, number>();
    const snapshotProducts = new Map<string, StockProduct>();

    for (const item of input.items) {
      const product = await this.productRepository.findById(
        input.storeId,
        item.productId,
      );
      if (!product) {
        throw new StockProductNotFoundError('InMemory', item.productId);
      }
      snapshotProducts.set(item.productId, product);
      snapshot.set(item.productId, product.quantity);
    }

    try {
      for (const item of input.items) {
        const product = snapshotProducts.get(item.productId)!;
        product.applyEntry(item.quantity);
        await this.productRepository.save(product);

        this.movements.unshift({
          id: `mov-${this.movements.length + 1}`,
          type: 'entry',
          quantity: item.quantity,
          notes: input.notesByProductId?.[item.productId] ?? null,
          createdAt: new Date().toISOString(),
          product: {
            id: product.id,
            name: product.name,
            photoUrl: product.photoObjectKey
              ? `/api/v1/stock-products/${product.id}/photo`
              : null,
          },
          requestedBy: null,
          authorizedBy: {
            id: input.authorizedById,
            name: input.authorizedByName,
          },
          storeId: input.storeId,
        });
      }
    } catch (err) {
      // rollback
      for (const [productId, qty] of snapshot.entries()) {
        const product = snapshotProducts.get(productId);
        if (product) {
          product.applyEntry(qty - product.quantity); // ajusta para o snapshot
          await this.productRepository.save(product);
        }
      }
      throw err;
    }
  }

  async createWithdrawal(input: {
    storeId: string;
    productId: string;
    quantity: number;
    requestedById: string | null;
    requestedByName: string | null;
    notes: string | null;
    authorizedById: string;
    authorizedByName: string;
  }): Promise<void> {
    const product = await this.productRepository.findById(
      input.storeId,
      input.productId,
    );
    if (!product) {
      throw new StockProductNotFoundError('InMemory', input.productId);
    }

    if (input.quantity > product.quantity) {
      throw new StockInsufficientQuantityError(
        'InMemory',
        product.quantity,
        input.quantity,
      );
    }

    product.applyWithdrawal(input.quantity);
    await this.productRepository.save(product);

    this.movements.unshift({
      id: `mov-${this.movements.length + 1}`,
      type: 'withdrawal',
      quantity: input.quantity,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      product: {
        id: product.id,
        name: product.name,
        photoUrl: product.photoObjectKey
          ? `/api/v1/stock-products/${product.id}/photo`
          : null,
      },
      requestedBy: input.requestedById
        ? {
            id: input.requestedById,
            name: input.requestedByName ?? 'Profissional',
          }
        : null,
      authorizedBy: { id: input.authorizedById, name: input.authorizedByName },
      storeId: input.storeId,
    });
  }

  async listMovements(
    storeId: string,
    criteria: StockMovementListCriteria,
  ): Promise<{
    items: StockMovementListItem[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const page = criteria.page ?? 1;
    const perPage = criteria.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const start = criteria.startDate
      ? new Date(`${criteria.startDate.slice(0, 10)}T00:00:00.000Z`).getTime()
      : null;
    const end = criteria.endDate
      ? new Date(`${criteria.endDate.slice(0, 10)}T23:59:59.999Z`).getTime()
      : null;

    const filtered = this.movements
      .filter((m) => m.storeId === storeId)
      .filter((m) => (criteria.type ? m.type === criteria.type : true))
      .filter((m) =>
        criteria.productId ? m.product.id === criteria.productId : true,
      )
      .filter((m) => {
        const t = new Date(m.createdAt).getTime();
        if (start !== null && t < start) return false;
        if (end !== null && t > end) return false;
        return true;
      })
      .sort((left, right) => {
        const direction = criteria.sortOrder === 'asc' ? 1 : -1;
        const compareStrings = (
          a: string | null | undefined,
          b: string | null | undefined,
        ) => (a ?? '').localeCompare(b ?? '', 'pt-BR') * direction;

        switch (criteria.sortBy) {
          case 'product':
            return compareStrings(left.product.name, right.product.name);
          case 'quantity':
            return (left.quantity - right.quantity) * direction;
          case 'withdrawnBy':
            return compareStrings(
              left.requestedBy?.name,
              right.requestedBy?.name,
            );
          case 'authorizedBy':
            return compareStrings(
              left.authorizedBy.name,
              right.authorizedBy.name,
            );
          case 'date':
            return (
              (new Date(left.createdAt).getTime() -
                new Date(right.createdAt).getTime()) *
              direction
            );
          default:
            return (
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime()
            );
        }
      });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const items = filtered.slice(skip, skip + perPage);

    return { items, total, page, perPage, totalPages };
  }

  // Helpers
  seedMovement(items: StockMovementListItem[], storeId: string) {
    for (const m of items) {
      this.movements.push({ ...m, storeId });
    }
  }
}
