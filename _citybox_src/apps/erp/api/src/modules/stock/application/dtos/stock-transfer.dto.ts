import type { StockTransfer } from '../../domain/entities/stock-transfer.entity';
import type { StockTransferListItem } from '../../domain/repositories/stock-transfer.repository.interface';

export type CreateStockTransferLineDto = {
  productId: string;
  quantity: string;
  batch?: string | null;
};

export type CreateStockTransferDto = {
  organizationId: string;
  fromStockId: string;
  toStockId: string;
  operatedAt: Date;
  carrierId?: string | null;
  responsibleName: string;
  notes?: string;
  createdByUserId: string;
  lines: CreateStockTransferLineDto[];
};

export type ListStockTransfersDto = {
  organizationId: string;
  tab?: 'active' | 'cancelled';
  search?: string;
  fromStockId?: string;
  toStockId?: string;
  page?: number;
  perPage?: number;
};

export type ListStockTransfersResult = {
  items: StockTransferListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: { active: number; cancelled: number };
};

export type CancelStockTransferDto = {
  organizationId: string;
  id: string;
  createdByUserId: string;
};

export type CancelStockTransferResult = {
  transfer: StockTransfer;
};
