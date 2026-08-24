import { beautifulFetch } from '@/lib/beautiful-api';
import type {
  ServiceItem,
  ProductItem,
  ServiceFormData,
  ProductFormData,
  StockMovement,
  StockMovementType,
  PaginatedProducts,
  PaginatedServices,
} from '../types/catalog.types';

export type { StockMovement, StockMovementType } from '../types/catalog.types';
export type ListCatalogParams = {
  search?: string;
  category?: string;
  active?: boolean;
  page?: number;
  perPage?: number;
};

// ==================== SERVIÇOS ====================

export async function listServices(
  params?: ListCatalogParams,
): Promise<PaginatedServices> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.category && params.category !== 'all') {
    query.set('category', params.category);
  }
  if (params?.active !== undefined) query.set('active', String(params.active));
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('perPage', String(params.perPage));

  const queryString = query.toString();
  const path = `/v1/services${queryString ? `?${queryString}` : ''}`;
  const response = await beautifulFetch<PaginatedServices>(path);

  return {
    ...response,
    data: response.data.map((item) => ({
      ...item,
      type: 'service' as const,
    })),
  };
}

export async function getServiceById(id: string): Promise<ServiceItem> {
  const response = await beautifulFetch<any>(`/v1/services/${id}`);
  return { ...response, type: 'service' as const };
}

export async function createService(data: ServiceFormData): Promise<ServiceItem> {
  const response = await beautifulFetch<any>('/v1/services', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      categories: data.categories,
      durationMinutes: data.durationMinutes,
      price: data.price,
      description: data.description || null,
      active: data.active,
    }),
  });

  return { ...response, type: 'service' as const };
}

export async function updateService(id: string, data: ServiceFormData): Promise<ServiceItem> {
  const response = await beautifulFetch<any>(`/v1/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: data.name,
      categories: data.categories,
      durationMinutes: data.durationMinutes,
      price: data.price,
      description: data.description || null,
      active: data.active,
    }),
  });

  return { ...response, type: 'service' as const };
}

export async function toggleServiceActive(id: string): Promise<ServiceItem> {
  const response = await beautifulFetch<any>(`/v1/services/${id}/toggle-active`, {
    method: 'PATCH',
  });

  return { ...response, type: 'service' as const };
}

export async function deleteService(id: string): Promise<void> {
  return beautifulFetch<void>(`/v1/services/${id}`, {
    method: 'DELETE',
  });
}

// ==================== PRODUTOS (INSUMOS DE CONSUMO) ====================

export async function listProducts(
  params?: ListCatalogParams,
): Promise<PaginatedProducts> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.active !== undefined) query.set('active', String(params.active));
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('perPage', String(params.perPage));

  const queryString = query.toString();
  const path = `/v1/products${queryString ? `?${queryString}` : ''}`;
  const response = await beautifulFetch<PaginatedProducts>(path);

  return {
    ...response,
    data: response.data.map((item) => ({
      ...item,
      type: 'product' as const,
    })),
  };
}

export async function createProduct(data: ProductFormData): Promise<ProductItem> {
  const response = await beautifulFetch<any>('/v1/products', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      sku: data.sku,
      unitOfMeasure: data.unitOfMeasure,
      stockQuantity: data.stockQuantity,
      minStockQuantity: data.minStockQuantity,
      costPrice: data.costPrice ?? null,
      description: data.description || null,
      active: data.active,
    }),
  });

  return { ...response, type: 'product' as const };
}

export async function updateProduct(id: string, data: ProductFormData): Promise<ProductItem> {
  const response = await beautifulFetch<any>(`/v1/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: data.name,
      sku: data.sku,
      unitOfMeasure: data.unitOfMeasure,
      stockQuantity: data.stockQuantity,
      minStockQuantity: data.minStockQuantity,
      costPrice: data.costPrice ?? null,
      description: data.description || null,
      active: data.active,
    }),
  });

  return { ...response, type: 'product' as const };
}

export async function toggleProductActive(id: string): Promise<ProductItem> {
  const response = await beautifulFetch<any>(`/v1/products/${id}/toggle-active`, {
    method: 'PATCH',
  });

  return { ...response, type: 'product' as const };
}

export async function deleteProduct(id: string): Promise<void> {
  return beautifulFetch<void>(`/v1/products/${id}`, {
    method: 'DELETE',
  });
}

export async function getProductById(id: string): Promise<ProductItem> {
  const response = await beautifulFetch<any>(`/v1/products/${id}`);
  return { ...response, type: 'product' as const };
}

export type ListStockMovementsParams = {
  page?: number;
  limit?: number;
  productId?: string;
  type?: 'IN' | 'OUT' | 'ALL';
  search?: string;
  startDate?: string;
  endDate?: string;
};

export type PaginatedStockMovementItem = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitOfMeasure: string;
  type: 'IN' | 'OUT';
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

export async function listAllStockMovements(
  params?: ListStockMovementsParams,
): Promise<PaginatedStockMovements> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.productId && params.productId !== 'ALL') query.set('productId', params.productId);
  if (params?.type && params.type !== 'ALL') query.set('type', params.type);
  if (params?.search) query.set('search', params.search);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);

  const queryString = query.toString();
  const path = `/v1/products/stock-movements${queryString ? `?${queryString}` : ''}`;
  return beautifulFetch<PaginatedStockMovements>(path);
}

export async function listProductStockMovements(productId: string): Promise<StockMovement[]> {
  const response = await beautifulFetch<StockMovement[]>(`/v1/products/${productId}/stock-movements`);
  return response;
}

export type AdjustStockData = {
  type: StockMovementType;
  quantity: number;
  note?: string;
};

export type AdjustStockBatchItem = {
  productId: string;
  type: StockMovementType;
  quantity: number;
  note?: string;
};

export async function adjustStockBatch(
  items: AdjustStockBatchItem[],
): Promise<void> {
  await beautifulFetch<void>('/v1/products/stock-movements/batch', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function adjustStock(
  productId: string,
  data: AdjustStockData,
): Promise<{ product: ProductItem; movement: StockMovement }> {
  const response = await beautifulFetch<{
    product: ProductItem;
    movement: StockMovement;
  }>(`/v1/products/${productId}/stock-movements`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return {
    product: { ...response.product, type: 'product' as const },
    movement: response.movement,
  };
}
