import type { ProductCategory } from '../entities/product-category.entity';

export type ProductCategoryListCriteria = {
  activeOnly?: boolean;
  search?: string;
  skip?: number;
  take?: number;
};

export type ProductCategoryWithProductCount = {
  category: ProductCategory;
  productCount: number;
};

export abstract class ProductCategoryRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<ProductCategory | null>;
  abstract findByName(
    organizationId: string,
    name: string,
  ): Promise<ProductCategory | null>;
  abstract findAll(
    organizationId: string,
    criteria?: ProductCategoryListCriteria,
  ): Promise<ProductCategory[]>;
  abstract findAllWithProductCounts(
    organizationId: string,
    criteria?: ProductCategoryListCriteria,
  ): Promise<ProductCategoryWithProductCount[]>;
  abstract count(
    organizationId: string,
    criteria?: Pick<ProductCategoryListCriteria, 'activeOnly' | 'search'>,
  ): Promise<number>;
  abstract save(category: ProductCategory): Promise<ProductCategory>;
  abstract delete(organizationId: string, id: string): Promise<void>;
}
