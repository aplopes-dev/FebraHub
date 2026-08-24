import type { Inventory } from '../../domain/entities/inventory.entity';
import type {
  InventoryDetail,
  InventoryListItem,
} from '../../domain/repositories/inventory.repository.interface';

export type CreateInventoryLineDto = {
  productId: string;
  countedQuantity: string;
};

export type CreateInventoryDto = {
  organizationId: string;
  stockId: string;
  name: string;
  createdByUserId: string;
  lines: CreateInventoryLineDto[];
};

export type CreateInventoryResult = {
  inventory: Inventory;
  itemsCount: number;
  divergentCount: number;
};

export type ListInventoriesDto = {
  organizationId: string;
  stockId: string;
  page?: number;
  perPage?: number;
};

export type ListInventoriesResult = {
  items: InventoryListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type FindInventoryByIdDto = {
  organizationId: string;
  id: string;
};

export type FindInventoryByIdResult = InventoryDetail;
