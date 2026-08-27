/** Shape devolvido pela API do backend — não usar direto na UI. */
export type ProductCategoryDto = {
  id: string;
  name: string;
  active: boolean;
  productCount?: number;
};

export type ProductCategoryListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ProductCategoryListResponseDto = {
  data: ProductCategoryDto[];
  meta: ProductCategoryListMetaDto;
};

export type ProductCategoryResponseDto = {
  data: ProductCategoryDto;
};

export type SaveProductCategoryPayload = {
  name: string;
  active: boolean;
};
