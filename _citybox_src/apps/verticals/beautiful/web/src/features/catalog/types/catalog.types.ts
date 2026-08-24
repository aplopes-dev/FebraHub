export type CatalogItemType = 'service' | 'product';

export interface ServiceItem {
  id: string;
  name: string;
  type: 'service';
  categories: string[];
  durationMinutes: number;
  price: number;
  description?: string;
  active: boolean;
  createdAt: string;
}

export type ServiceListStats = {
  totalServices: number;
  activeCount: number;
  inactiveCount: number;
  averagePrice: number;
  averageDuration: number;
};

export type PaginatedServices = {
  data: ServiceItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  stats: ServiceListStats;
};

export interface ProductItem {
  id: string;
  name: string;
  type: 'product';
  sku: string;
  unitOfMeasure: string;
  stockQuantity: number;
  minStockQuantity: number;
  costPrice?: number;
  description?: string;
  active: boolean;
  createdAt: string;
  /** Presente em GET /products/:id — últimas movimentações (máx. 50). */
  stockMovements?: StockMovement[];
}

export type ProductListStats = {
  totalProducts: number;
  totalAssetValue: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

export type PaginatedProducts = {
  data: ProductItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  stats: ProductListStats;
};

export type StockMovementType = 'IN' | 'OUT';

export type StockSituation = 'in_stock' | 'low_stock' | 'out_of_stock';

export const STOCK_SITUATION_LABELS: Record<StockSituation, string> = {
  in_stock: 'Em estoque',
  low_stock: 'Estoque baixo',
  out_of_stock: 'Sem estoque',
};

export function getStockSituation(
  stockQuantity: number,
  minStockQuantity: number,
): StockSituation {
  if (stockQuantity <= 0) return 'out_of_stock';
  if (stockQuantity <= minStockQuantity) return 'low_stock';
  return 'in_stock';
}

export type StockMovement = {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  note: string | null;
  createdAt: string;
};

export type PaginatedStockMovementItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitOfMeasure: string;
  type: StockMovementType;
  quantity: number;
  note?: string;
  createdAt: string;
};

export type PaginatedStockMovements = {
  items: PaginatedStockMovementItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CatalogItem = ServiceItem | ProductItem;

export type ServiceFormData = {
  name: string;
  categories: string[];
  durationMinutes: number;
  price: number;
  description?: string;
  active: boolean;
};

export type ProductFormData = {
  name: string;
  sku: string;
  unitOfMeasure: string;
  stockQuantity: number;
  minStockQuantity: number;
  costPrice?: number;
  description?: string;
  active: boolean;
};
