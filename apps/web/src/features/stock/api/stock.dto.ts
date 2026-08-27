/**
 * Contrato HTTP de `/v1/stocks` — mapear para o domínio do front em
 * `stock.mapper.ts` (`branchIds` ↔ `unitIds`).
 */
export type StockLocationDto = "proprio" | "externo" | "deposito";
export type StockPropertyDto = "proprio" | "terceiro";

export type StockDto = {
  id: string;
  name: string;
  location: StockLocationDto;
  property: StockPropertyDto;
  branchIds: string[];
  isDefault: boolean;
  hasMovements: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StockListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type StockListResponseDto = {
  data: StockDto[];
  meta: StockListMetaDto;
};

export type StockResponseDto = {
  data: StockDto;
};

export type SaveStockPayload = {
  name: string;
  location: StockLocationDto;
  property: StockPropertyDto;
  branchIds?: string[];
};
