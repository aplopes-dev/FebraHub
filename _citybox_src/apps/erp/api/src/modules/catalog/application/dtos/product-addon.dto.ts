import type { ProductAddon } from '../../domain/entities/product-addon.entity';

export type CreateProductAddonDto = {
  organizationId: string;
  name: string;
  defaultPriceCents: number;
};

export type UpdateProductAddonDto = CreateProductAddonDto & { id: string };

export type DeleteProductAddonDto = {
  organizationId: string;
  id: string;
};

export type ListProductAddonsDto = {
  organizationId: string;
  active?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
};

export type ListProductAddonsResult = {
  items: ProductAddon[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
