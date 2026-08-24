import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { StockMovementRepository } from '../../../../stock/domain/repositories/stock-movement.repository.interface';
import type {
  ListProductsDto,
  ListProductsResult,
} from '../../dtos/product.dto';
import type { Product } from '../../../domain/entities/product.entity';

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

function needsStockAggregation(
  sort: ListProductsDto['sort'],
  stockFilter: ListProductsDto['stockFilter'],
): boolean {
  return (
    sort === 'stock_asc' ||
    sort === 'stock_desc' ||
    stockFilter === 'in_stock' ||
    stockFilter === 'out_of_stock'
  );
}

function effectiveStock(
  product: Product,
  quantities: Map<string, number>,
): number {
  if (!product.trackStock) return 0;
  return quantities.get(product.id) ?? 0;
}

@Injectable()
export class ListProductsUseCase implements IUseCase<
  ListProductsDto,
  ListProductsResult
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async execute({
    organizationId,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    tab = 'all',
    search,
    sort = 'name_asc',
    types,
    variants,
    categoryIds,
    branchId,
    trackStock,
    stockFilter,
    availableOnErp,
    availableOnPdv,
  }: ListProductsDto): Promise<ListProductsResult> {
    const safePerPage = Math.min(Math.max(1, perPage), MAX_PER_PAGE);
    const safePage = Math.max(1, page);

    const baseCriteria = {
      tab,
      search: search?.trim() || undefined,
      sort,
      types: types?.length ? types : undefined,
      variants: variants && variants !== 'all' ? variants : undefined,
      categoryIds: categoryIds?.length ? categoryIds : undefined,
      branchId: branchId ?? undefined,
      trackStock: trackStock === true ? true : undefined,
      stockFilter,
      availableOnErp,
      availableOnPdv,
    };

    const tabCounts = await this.productRepository.countByTabs(
      organizationId,
      branchId ?? undefined,
    );

    if (needsStockAggregation(sort, stockFilter)) {
      return this.executeWithStockAggregation({
        organizationId,
        baseCriteria,
        sort,
        stockFilter,
        branchId: branchId ?? undefined,
        safePage,
        safePerPage,
        tabCounts,
      });
    }

    const criteria = { ...baseCriteria, stockFilter: undefined };
    const total = await this.productRepository.count(organizationId, criteria);
    const totalPages = Math.max(1, Math.ceil(total / safePerPage));
    const currentPage = Math.min(safePage, totalPages);

    const products = await this.productRepository.findAll(organizationId, {
      ...criteria,
      skip: (currentPage - 1) * safePerPage,
      take: safePerPage,
    });

    return {
      products,
      total,
      page: currentPage,
      perPage: safePerPage,
      totalPages,
      tabCounts,
    };
  }

  private async executeWithStockAggregation(input: {
    organizationId: string;
    baseCriteria: {
      tab: NonNullable<ListProductsDto['tab']>;
      search?: string;
      sort: NonNullable<ListProductsDto['sort']>;
      types?: ListProductsDto['types'];
      variants?: ListProductsDto['variants'];
      categoryIds?: string[];
      branchId?: string | null;
      trackStock?: boolean;
      stockFilter?: ListProductsDto['stockFilter'];
      availableOnErp?: boolean;
      availableOnPdv?: boolean;
    };
    sort: NonNullable<ListProductsDto['sort']>;
    stockFilter?: ListProductsDto['stockFilter'];
    branchId?: string;
    safePage: number;
    safePerPage: number;
    tabCounts: ListProductsResult['tabCounts'];
  }): Promise<ListProductsResult> {
    // Carrega todos os matches base (sem paginação) para ordenar/filtrar por saldo.
    const all = await this.productRepository.findAll(input.organizationId, {
      ...input.baseCriteria,
      sort: 'name_asc',
      stockFilter: undefined,
      skip: undefined,
      take: undefined,
    });

    const quantities =
      await this.stockMovementRepository.sumQuantitiesByProductIds(
        input.organizationId,
        all.map((product) => product.id),
        { branchId: input.branchId },
      );

    let rows = all.map((product) => ({
      product,
      stock: effectiveStock(product, quantities),
    }));

    if (input.stockFilter === 'in_stock') {
      rows = rows.filter((row) => row.stock > 0);
    } else if (input.stockFilter === 'out_of_stock') {
      rows = rows.filter((row) => row.stock <= 0);
    }

    if (input.sort === 'stock_asc') {
      rows = [...rows].sort(
        (a, b) =>
          a.stock - b.stock ||
          a.product.name.localeCompare(b.product.name, 'pt-BR'),
      );
    } else if (input.sort === 'stock_desc') {
      rows = [...rows].sort(
        (a, b) =>
          b.stock - a.stock ||
          a.product.name.localeCompare(b.product.name, 'pt-BR'),
      );
    } else {
      // Mantém ordenação já pedida no repositório (name/price) — reaplicada
      // aqui sobre o subconjunto filtrado por estoque.
      rows = [...rows].sort((a, b) => {
        switch (input.sort) {
          case 'name_desc':
            return b.product.name.localeCompare(a.product.name, 'pt-BR');
          case 'price_asc':
            return a.product.basePriceCents - b.product.basePriceCents;
          case 'price_desc':
            return b.product.basePriceCents - a.product.basePriceCents;
          default:
            return a.product.name.localeCompare(b.product.name, 'pt-BR');
        }
      });
    }

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / input.safePerPage));
    const currentPage = Math.min(input.safePage, totalPages);
    const start = (currentPage - 1) * input.safePerPage;
    const products = rows
      .slice(start, start + input.safePerPage)
      .map((row) => row.product);

    return {
      products,
      total,
      page: currentPage,
      perPage: input.safePerPage,
      totalPages,
      tabCounts: input.tabCounts,
    };
  }
}
