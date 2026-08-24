import type { ProductCategory } from '../../domain/entities/product-category.entity';

export type CreateProductCategoryDto = {
  organizationId: string;
  name: string;
  active?: boolean;
};

export type UpdateProductCategoryDto = {
  organizationId: string;
  id: string;
  name: string;
  active: boolean;
};

export type DeleteProductCategoryDto = {
  organizationId: string;
  id: string;
};

export type ListProductCategoriesDto = {
  organizationId: string;
  activeOnly?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
};

export type ProductCategoryListItem = {
  category: ProductCategory;
  productCount: number;
};

export type ListProductCategoriesResult = {
  items: ProductCategoryListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
