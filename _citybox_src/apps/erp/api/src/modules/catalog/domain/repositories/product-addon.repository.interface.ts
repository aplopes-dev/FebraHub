import type { ProductAddon } from '../entities/product-addon.entity';

export type ProductAddonListCriteria = {
  activeOnly?: boolean;
  search?: string;
  skip?: number;
  take?: number;
};

export abstract class ProductAddonRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<ProductAddon | null>;
  abstract findByName(
    organizationId: string,
    name: string,
  ): Promise<ProductAddon | null>;
  abstract findAll(
    organizationId: string,
    criteria?: ProductAddonListCriteria,
  ): Promise<ProductAddon[]>;
  abstract count(
    organizationId: string,
    criteria?: Pick<ProductAddonListCriteria, 'activeOnly' | 'search'>,
  ): Promise<number>;
  abstract save(addon: ProductAddon): Promise<ProductAddon>;
}
