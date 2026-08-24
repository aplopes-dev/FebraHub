import type { Purchase, PurchaseLineStatus } from '../entities/purchase.entity';
import type { StockMovement } from '../entities/stock-movement.entity';

export const PURCHASE_LIST_TABS = ['active', 'deleted'] as const;
export type PurchaseListTab = (typeof PURCHASE_LIST_TABS)[number];

export const PURCHASE_LIST_STATUSES = ['all', 'pending', 'received'] as const;
export type PurchaseListStatus = (typeof PURCHASE_LIST_STATUSES)[number];

export type PurchaseListCriteria = {
  /** Aba da listagem. `active` (padrão) traz as não excluídas. */
  tab?: PurchaseListTab;
  /** Filtro por `deliveryStatus`. `all` (padrão) não filtra. */
  status?: PurchaseListStatus;
  search?: string;
  stockId?: string;
  supplierId?: string;
  /** Intervalo (inclusive) sobre `purchasedAt`. */
  dateFrom?: Date;
  dateTo?: Date;
  skip?: number;
  take?: number;
};

export type PurchaseListItem = {
  purchase: Purchase;
  stockName: string;
  supplierName: string;
  carrierName: string | null;
};

export type PurchaseDetailLine = {
  productId: string;
  productName: string;
  productSku: string;
  quantity: string;
  costCents: number;
  status: PurchaseLineStatus;
};

export type PurchaseDetail = {
  purchase: Purchase;
  stockName: string;
  supplierName: string;
  carrierName: string | null;
  lines: PurchaseDetailLine[];
};

/**
 * Repositório de compras — grava documento + linhas e, no máximo, 1
 * movimento de entrada por compra, tudo na mesma transação.
 */
export abstract class PurchaseRepository {
  /**
   * Persiste a compra (create ou update — sempre substitui o conjunto de
   * linhas) e, se `movement` não for `null`, grava o `StockMovement` de
   * entrada e o `stockMovementId` na mesma transação.
   */
  abstract saveWithOptionalMovement(
    purchase: Purchase,
    movement: StockMovement | null,
  ): Promise<Purchase>;

  /** Soft-delete — sem reversão de saldo (regra F7 §4). */
  abstract softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void>;

  /** Limpa `deletedAt` — sem efeito no ledger. */
  abstract clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<PurchaseDetail | null>;

  abstract findAll(
    organizationId: string,
    criteria?: PurchaseListCriteria,
  ): Promise<PurchaseListItem[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<PurchaseListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract countByTabs(
    organizationId: string,
  ): Promise<{ active: number; deleted: number }>;
}
