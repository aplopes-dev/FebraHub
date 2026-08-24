import type {
  Stock,
  StockLocation,
  StockProperty,
} from '../../domain/entities/stock.entity';

export type CreateStockDto = {
  organizationId: string;
  name: string;
  location: StockLocation;
  property: StockProperty;
  branchIds?: string[];
};

export type UpdateStockDto = {
  organizationId: string;
  id: string;
  name: string;
  location: StockLocation;
  property: StockProperty;
  branchIds?: string[];
};

export type ListStocksDto = {
  organizationId: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export type ListStocksResult = {
  items: Stock[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  /**
   * Ids da página que têm movimento ou saldo — o presenter usa para marcar o
   * depósito como não-excluível. Resolvido em lote pelo use-case (era um
   * `Promise.all` de 2 COUNTs por linha no controller).
   */
  stockIdsWithMovements: Set<string>;
};

export type FindStockByIdDto = { organizationId: string; id: string };

export type DeleteStockDto = { organizationId: string; id: string };
