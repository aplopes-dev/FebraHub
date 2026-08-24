import type {
  MovementsFilters,
  StockEntryPayload,
  StockBulkEntryPayload,
  StockWithdrawalPayload,
  CreateProductPayload,
  UpdateProductPayload,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from "./stock.service";

import type {
  Supplier,
  StockMovement,
  StockMovementsResponse,
  StockMovementType,
  StockProduct,
  StockStats,
} from "../types";
import { clinicaFetch, clinicaUpload } from "@/features/clinic/shared/api";

const CLINICA_PHOTO_PROXY_PREFIX = "/api/proxy/clinica";

function toStockProductPhotoUrl(
  storeId: string,
  relativePhotoUrl: string | null,
  cacheBust: string | number,
): string | null {
  if (!relativePhotoUrl) return null;

  const basePath = relativePhotoUrl.startsWith(CLINICA_PHOTO_PROXY_PREFIX)
    ? relativePhotoUrl.split("?")[0]!
    : (() => {
        const path = relativePhotoUrl.startsWith("/api/")
          ? relativePhotoUrl.replace(/^\/api/, "")
          : relativePhotoUrl;
        return `${CLINICA_PHOTO_PROXY_PREFIX}${path}`;
      })();

  const params = new URLSearchParams({ storeId: storeId });
  params.set("v", String(cacheBust));
  return `${basePath}?${params.toString()}`;
}

function buildProductsListQuery(filters?: {
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): string {
  const page = filters?.page ?? 1;
  const perPage = filters?.perPage ?? 1000;
  const search = filters?.search;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  if (search?.trim()) params.set("search", search.trim());
  if (filters?.sortBy) params.set("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);
  return `/v1/stock-products?${params.toString()}`;
}

function buildMovementsListQuery(
  filters?: MovementsFilters,
): { path: string; page: number; perPage: number } {
  const page = filters?.page ?? 1;
  const perPage = filters?.limit ?? 20;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  if (filters?.type) params.set("type", filters.type);
  if (filters?.productId) params.set("productId", filters.productId);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.sortBy) params.set("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

  return { path: `/v1/stock-movements?${params.toString()}`, page, perPage };
}

export const stockService = {
  suppliers: {
    list: async (storeId: string): Promise<{ suppliers: Supplier[] }> => {
      const res = await clinicaFetch<{ data: Supplier[] }>(storeId, "/v1/stock-suppliers");
      return { suppliers: res.data };
    },

    create: async (
      storeId: string,
      data: CreateSupplierPayload,
    ): Promise<{ id: string; name: string }> => {
      const res = await clinicaFetch<{
        data: { id: string; name: string };
      }>(storeId, "/v1/stock-suppliers", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          phone: data.phone ?? null,
          email: data.email ?? null,
        }),
      });

      return res.data;
    },

    update: async (
      storeId: string,
      id: string,
      data: UpdateSupplierPayload,
    ): Promise<void> => {
      await clinicaFetch<void>(storeId, `/v1/stock-suppliers/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name ?? "",
          phone: data.phone ?? null,
          email: data.email ?? null,
        }),
      });
    },

    delete: async (storeId: string, id: string): Promise<void> => {
      await clinicaFetch<void>(storeId, `/v1/stock-suppliers/${id}`, { method: "DELETE" });
    },
  },

  products: {
    list: async (
      storeId: string,
      filters?: {
        search?: string;
        page?: number;
        perPage?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      },
    ): Promise<{
      products: StockProduct[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }> => {
      const cacheBust = Date.now();

      const res = await clinicaFetch<{
        data: StockProduct[];
        meta: { total: number; page: number; perPage: number; totalPages: number };
      }>(storeId, buildProductsListQuery(filters));

      return {
        products: res.data.map((p) => ({
          ...p,
          photoUrl: toStockProductPhotoUrl(storeId, p.photoUrl, cacheBust),
        })),
        pagination: {
          page: res.meta.page,
          limit: res.meta.perPage,
          total: res.meta.total,
          totalPages: res.meta.totalPages,
        },
      };
    },

    create: async (
      storeId: string,
      data: CreateProductPayload,
    ): Promise<{ id: string; name: string; photoUrl: string | null }> => {
      const cacheBust = Date.now();
      const res = await clinicaFetch<{
        data: { id: string; name: string; photoUrl: string | null };
      }>(storeId, "/v1/stock-products", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          minQuantity: data.minQuantity,
          unitCost: data.unitCost,
          sku: data.sku ?? null,
          supplierId: data.supplierId ?? null,
        }),
      });

      return {
        id: res.data.id,
        name: res.data.name,
        photoUrl: toStockProductPhotoUrl(storeId, res.data.photoUrl, cacheBust),
      };
    },

    update: async (
      storeId: string,
      id: string,
      data: UpdateProductPayload,
    ): Promise<void> => {
      if (!data.name || !data.category || data.minQuantity === undefined || data.unitCost === undefined) {
        throw new Error("Dados incompletos para atualizar produto");
      }

      await clinicaFetch<void>(storeId, `/v1/stock-products/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          minQuantity: data.minQuantity,
          unitCost: data.unitCost,
          sku: data.sku ?? null,
          supplierId: data.supplierId ?? null,
        }),
      });
    },

    delete: async (storeId: string, id: string): Promise<void> => {
      await clinicaFetch<void>(storeId, `/v1/stock-products/${id}`, { method: "DELETE" });
    },

    uploadPhoto: async (storeId: string, productId: string, file: File): Promise<void> => {
      const formData = new FormData();
      formData.append("file", file);
      await clinicaUpload<{ data: { photoUrl: string } }>(
        storeId,
        `/v1/stock-products/${productId}/photo`,
        formData,
      );
    },

    deletePhoto: async (storeId: string, productId: string): Promise<void> => {
      await clinicaFetch<void>(storeId, `/v1/stock-products/${productId}/photo`, {
        method: "DELETE",
      });
    },
  },

  stats: async (storeId: string): Promise<StockStats> => {
    const res = await clinicaFetch<{ data: StockStats }>(storeId, "/v1/stock-stats");
    return res.data;
  },

  entries: {
    create: async (storeId: string, data: StockEntryPayload): Promise<void> => {
      await clinicaFetch<void>(storeId, "/v1/stock-entries", {
        method: "POST",
        body: JSON.stringify({
          productId: data.productId,
          quantity: data.quantity,
          notes: data.notes ?? null,
        }),
      });
    },

    createBulk: async (
      storeId: string,
      data: StockBulkEntryPayload,
    ): Promise<void> => {
      await clinicaFetch<void>(storeId, "/v1/stock-entries/bulk", {
        method: "POST",
        body: JSON.stringify({
          items: data.items,
        }),
      });
    },
  },

  withdrawals: {
    create: async (storeId: string, data: StockWithdrawalPayload): Promise<void> => {
      await clinicaFetch<void>(storeId, "/v1/stock-withdrawals", {
        method: "POST",
        body: JSON.stringify({
          productId: data.productId,
          quantity: data.quantity,
          requestedById: data.requestedById ?? undefined,
          requestedByName: data.requestedByName ?? undefined,
          notes: data.notes ?? null,
        }),
      });
    },
  },

  movements: {
    list: async (storeId: string, filters?: MovementsFilters): Promise<StockMovementsResponse> => {
      const cacheBust = Date.now();

      const { path } = buildMovementsListQuery(filters);
      const res = await clinicaFetch<{
        data: StockMovement[];
        meta: { total: number; page: number; perPage: number; totalPages: number };
      }>(storeId, path);

      return {
        movements: res.data.map((m) => ({
          ...m,
          product: {
            ...m.product,
            photoUrl: toStockProductPhotoUrl(storeId, m.product.photoUrl, cacheBust),
          },
        })),
        pagination: {
          page: res.meta.page,
          limit: res.meta.perPage,
          total: res.meta.total,
          totalPages: res.meta.totalPages,
        },
      };
    },
  },
};

