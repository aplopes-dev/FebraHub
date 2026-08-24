import type { StockMovementType, StockStatus } from '../stock-types';

export type StockMovementListItem = {
  id: string;
  type: StockMovementType;
  quantity: number;
  notes: string | null;
  createdAt: string;
  product: { id: string; name: string; photoUrl: string | null };
  requestedBy: { id: string; name: string } | null;
  authorizedBy: { id: string; name: string };
};

export type StockMovementListCriteria = {
  type?: StockMovementType;
  productId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
  sortBy?: 'product' | 'quantity' | 'withdrawnBy' | 'authorizedBy' | 'date';
  sortOrder?: 'asc' | 'desc';
};

export abstract class StockMovementRepository {
  abstract createEntry(input: {
    storeId: string;
    productId: string;
    quantity: number;
    notes: string | null;
    authorizedById: string;
    authorizedByName: string;
  }): Promise<void>;

  abstract createBulkEntry(input: {
    storeId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
    notesByProductId?: Record<string, string | null>;
    authorizedById: string;
    authorizedByName: string;
  }): Promise<void>;

  abstract createWithdrawal(input: {
    storeId: string;
    productId: string;
    quantity: number;
    requestedById: string | null;
    requestedByName: string | null;
    notes: string | null;
    authorizedById: string;
    authorizedByName: string;
  }): Promise<void>;

  abstract listMovements(
    storeId: string,
    criteria: StockMovementListCriteria,
  ): Promise<{
    items: StockMovementListItem[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }>;
}
