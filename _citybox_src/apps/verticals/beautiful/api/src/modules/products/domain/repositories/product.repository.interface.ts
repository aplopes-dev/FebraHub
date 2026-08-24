import { ProductEntity } from '../entities/product.entity';

export interface ListProductsFilter {
  search?: string;
  active?: boolean;
}

export interface ListProductsPagination {
  page: number;
  perPage: number;
}

export interface PaginatedProducts {
  items: ProductEntity[];
  total: number;
}

export abstract class ProductRepository {
  abstract save(product: ProductEntity): Promise<void>;
  abstract findById(storeId: string, id: string): Promise<ProductEntity | null>;
  abstract findAll(
    storeId: string,
    filter?: ListProductsFilter,
  ): Promise<ProductEntity[]>;
  abstract findPaginated(
    storeId: string,
    filter: ListProductsFilter,
    pagination: ListProductsPagination,
  ): Promise<PaginatedProducts>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
