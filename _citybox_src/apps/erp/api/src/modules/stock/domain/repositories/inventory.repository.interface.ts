import type { Inventory } from '../entities/inventory.entity';
import type { StockMovement } from '../entities/stock-movement.entity';

export type InventoryListCriteria = {
  stockId: string;
  skip?: number;
  take?: number;
};

export type InventoryLineDetail = {
  productId: string;
  productName: string;
  productSku: string;
  unit: string;
  systemQuantity: string;
  countedQuantity: string;
};

export type InventoryDetail = {
  inventory: Inventory;
  lines: InventoryLineDetail[];
};

export type InventoryListItem = {
  inventory: Inventory;
  itemsCount: number;
  divergentCount: number;
};

/**
 * Repositório de inventário — create completed + ajustes de ledger atômicos.
 */
export abstract class InventoryRepository {
  /**
   * Persiste inventário + linhas e, na mesma transação, até 2 movimentos
   * de ajuste (`sourceType=inventory`).
   */
  abstract createCompletedWithAdjustments(
    inventory: Inventory,
    adjustments: StockMovement[],
  ): Promise<Inventory>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<InventoryDetail | null>;

  abstract findAll(
    organizationId: string,
    criteria: InventoryListCriteria,
  ): Promise<InventoryListItem[]>;

  abstract count(
    organizationId: string,
    criteria: Pick<InventoryListCriteria, 'stockId'>,
  ): Promise<number>;
}
