import type {
  StockMovement,
  StockMovementType,
} from '../../domain/entities/stock-movement.entity';
import type { StockMovementReason } from '../../domain/entities/stock-movement-reason';
import type {
  ProductStockMovementLine,
  StockBalanceListItem,
  StockMovementDetail,
  StockMovementListItem,
} from '../../domain/repositories/stock-movement.repository.interface';

export type CreateStockMovementDto = {
  organizationId: string;
  stockId: string;
  categoryId: string;
  type: StockMovementType;
  operatedAt: Date;
  createdByUserId: string;
  lines: Array<{
    productId: string;
    quantity: string;
    costCents: number;
  }>;
};

export type ListStockMovementsDto = {
  organizationId: string;
  tab?: 'all' | StockMovementType;
  search?: string;
  reason?: StockMovementReason;
  page?: number;
  perPage?: number;
};

export type ListStockMovementsResult = {
  items: StockMovementListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: { all: number; entrada: number; saida: number };
};

export type FindStockMovementByIdDto = {
  organizationId: string;
  id: string;
};

export type ListStockBalanceDto = {
  organizationId: string;
  stockId: string;
  search?: string;
  status?: 'ok' | 'low' | 'empty';
  page?: number;
  perPage?: number;
};

export type ListStockBalanceResult = {
  items: StockBalanceListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ListProductStockMovementsDto = {
  organizationId: string;
  stockId: string;
  productId: string;
};

export type { StockMovement, StockMovementDetail, ProductStockMovementLine };
