import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductEntity } from '../../../domain/entities/product.entity';
import {
  ListProductsFilter,
  ProductRepository,
} from '../../../domain/repositories/product.repository.interface';

export interface ListProductsInput extends ListProductsFilter {
  storeId: string;
  page?: number;
  perPage?: number;
}

export type ProductListStats = {
  totalProducts: number;
  totalAssetValue: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

export type ListProductsResult = {
  items: ProductEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  stats: ProductListStats;
};

function computeStats(products: ProductEntity[]): ProductListStats {
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let totalAssetValue = 0;

  for (const product of products) {
    if (product.stockQuantity <= 0) {
      outOfStock += 1;
    } else if (product.stockQuantity <= product.minStockQuantity) {
      lowStock += 1;
    } else {
      inStock += 1;
    }
    totalAssetValue += product.stockQuantity * (product.costPrice ?? 0);
  }

  return {
    totalProducts: products.length,
    totalAssetValue,
    inStock,
    lowStock,
    outOfStock,
  };
}

@Injectable()
export class ListProductsUseCase implements IUseCase<
  ListProductsInput,
  ListProductsResult
> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: ListProductsInput): Promise<ListProductsResult> {
    const page = Math.max(1, input.page ?? 1);
    const perPage = Math.min(100, Math.max(1, input.perPage ?? 10));
    const filter: ListProductsFilter = {
      search: input.search,
      active: input.active,
    };

    const [{ items, total }, allProducts] = await Promise.all([
      this.productRepository.findPaginated(input.storeId, filter, {
        page,
        perPage,
      }),
      this.productRepository.findAll(input.storeId),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
      stats: computeStats(allProducts),
    };
  }
}
