import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as catalogService from '../services/catalog-service';
import type { ServiceFormData, ProductFormData } from '../types/catalog.types';

export const CATALOG_SERVICES_QUERY_KEY = ['catalog-services'] as const;
export const CATALOG_PRODUCTS_QUERY_KEY = ['catalog-products'] as const;

export function useServicesQuery(params?: catalogService.ListCatalogParams) {
  return useQuery({
    queryKey: [...CATALOG_SERVICES_QUERY_KEY, params],
    queryFn: () => catalogService.listServices(params),
  });
}

export function useServiceQuery(id: string | null) {
  return useQuery({
    queryKey: [...CATALOG_SERVICES_QUERY_KEY, 'detail', id],
    queryFn: () => catalogService.getServiceById(id!),
    enabled: Boolean(id),
  });
}

export function useProductsQuery(
  params?: catalogService.ListCatalogParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [...CATALOG_PRODUCTS_QUERY_KEY, params],
    queryFn: () => catalogService.listProducts(params),
    enabled,
  });
}

export function useCreateServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ServiceFormData) => catalogService.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_SERVICES_QUERY_KEY });
    },
  });
}

export function useUpdateServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceFormData }) =>
      catalogService.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_SERVICES_QUERY_KEY });
    },
  });
}

export function useToggleServiceActiveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.toggleServiceActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_SERVICES_QUERY_KEY });
    },
  });
}

export function useDeleteServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_SERVICES_QUERY_KEY });
    },
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductFormData) => catalogService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_PRODUCTS_QUERY_KEY });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      catalogService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_PRODUCTS_QUERY_KEY });
    },
  });
}

export function useToggleProductActiveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.toggleProductActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_PRODUCTS_QUERY_KEY });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_PRODUCTS_QUERY_KEY });
    },
  });
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: catalogService.AdjustStockData;
    }) => catalogService.adjustStock(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CATALOG_STOCK_MOVEMENTS_QUERY_KEY });
    },
  });
}

export function useAdjustStockBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: catalogService.AdjustStockBatchItem[]) =>
      catalogService.adjustStockBatch(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CATALOG_STOCK_MOVEMENTS_QUERY_KEY });
    },
  });
}

export const CATALOG_STOCK_MOVEMENTS_QUERY_KEY = ['catalog-stock-movements'] as const;

export function useAllStockMovementsQuery(
  params?: catalogService.ListStockMovementsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [...CATALOG_STOCK_MOVEMENTS_QUERY_KEY, params],
    queryFn: () => catalogService.listAllStockMovements(params),
    enabled,
  });
}

export function useProductStockMovementsQuery(productId: string | null) {
  return useQuery({
    queryKey: [...CATALOG_STOCK_MOVEMENTS_QUERY_KEY, productId],
    queryFn: () => catalogService.listProductStockMovements(productId!),
    enabled: Boolean(productId),
  });
}

