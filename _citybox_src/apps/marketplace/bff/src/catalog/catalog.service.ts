import { Injectable } from '@nestjs/common';
import { getConsumerClient } from '../database/consumer.js';
import { CacheService } from '../cache/cache.service.js';
import { InjectService } from '../common/inject.js';
import { notFound } from '../common/envelope.js';
import { money } from '../common/money.js';
import { createTypesenseClient, searchProductIds } from '../search/client.js';
import type { Prisma } from '../generated/consumer/client.js';
import { PRODUCT_INCLUDE, toApiProduct } from './product.presenter.js';

const HOME_CACHE_KEY = 'catalog:home';
const HOME_CACHE_TTL = 120;
const CATEGORIES_CACHE_KEY = 'catalog:categories';
const CATEGORIES_CACHE_TTL = 300;
const DEFAULT_PAGE_SIZE = 20;
const MAX_SUGGESTIONS = 8;

export interface SearchParams {
  q?: string;
  categoryId?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  freeShipping?: boolean;
  express?: boolean;
  sortBy?: string;
  page: number;
  pageSize: number;
}

/** Valores de ordenação aceitos (contrato: filtersMetadata do web). */
const SORT_ORDER: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  price_asc: [{ price: 'asc' }, { id: 'asc' }],
  price_desc: [{ price: 'desc' }, { id: 'asc' }],
  rating: [{ rating: 'desc' }, { id: 'asc' }],
  discount: [{ discountPercent: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
  newest: [{ createdAt: 'desc' }, { id: 'asc' }],
};

@Injectable()
export class CatalogService {
  private readonly db = getConsumerClient();
  private readonly typesense = createTypesenseClient();

  constructor(@InjectService(CacheService) private readonly cache: CacheService) {}

  async home() {
    const cached = await this.cache.get<object>(HOME_CACHE_KEY);
    if (cached) return cached;

    const sections = await this.db.homeSection.findMany({ orderBy: { sortOrder: 'asc' } });
    const productIds = [...new Set(sections.flatMap((s) => s.productIds))];
    const rows = await this.db.product.findMany({
      where: { id: { in: productIds }, published: true },
      include: PRODUCT_INCLUDE,
    });
    const payload = {
      sections: sections.map((s) => ({ id: s.id, title: s.title, productIds: s.productIds })),
      products: rows.map(toApiProduct),
    };
    await this.cache.set(HOME_CACHE_KEY, payload, HOME_CACHE_TTL);
    return payload;
  }

  async categories() {
    const cached = await this.cache.get<object>(CATEGORIES_CACHE_KEY);
    if (cached) return cached;

    const rows = await this.db.category.findMany({ orderBy: { sortOrder: 'asc' } });
    const payload = {
      categories: rows.map((c) => ({ id: c.id, name: c.name, icon: c.icon, colorHex: c.colorHex })),
    };
    await this.cache.set(CATEGORIES_CACHE_KEY, payload, CATEGORIES_CACHE_TTL);
    return payload;
  }

  async categoryProducts(categoryId: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const category = await this.db.category.findUnique({ where: { id: categoryId } });
    if (!category) throw notFound('Categoria não encontrada');

    const where = { categoryId, published: true } as const;
    const [total, rows] = await Promise.all([
      this.db.product.count({ where }),
      this.db.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      data: {
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon,
          colorHex: category.colorHex,
        },
        products: rows.map(toApiProduct),
      },
      meta: { page, pageSize, total },
    };
  }

  async product(id: string) {
    const row = await this.db.product.findFirst({
      where: { id, published: true },
      include: PRODUCT_INCLUDE,
    });
    if (!row) throw notFound('Produto não encontrado');
    return { product: toApiProduct(row) };
  }

  async search(params: SearchParams) {
    const hasExtraFilters =
      params.brand !== undefined ||
      params.minPrice !== undefined ||
      params.maxPrice !== undefined ||
      params.minRating !== undefined ||
      params.freeShipping === true ||
      params.express === true;
    const isRelevance = !params.sortBy || params.sortBy === 'relevance';

    // Caminho Typesense: só quando a busca é puramente q/categoryId por relevância —
    // filtros/sort adicionais quebrariam a paginação feita no índice.
    if (!hasExtraFilters && isRelevance) {
      const hit = await searchProductIds(this.typesense, params.q ?? '', {
        categoryId: params.categoryId,
        page: params.page,
        pageSize: params.pageSize,
      });
      if (hit) {
        const rows = await this.db.product.findMany({
          where: { id: { in: hit.ids }, published: true },
          include: PRODUCT_INCLUDE,
        });
        const byId = new Map(rows.map((r) => [r.id, r]));
        const products = hit.ids
          .map((id) => byId.get(id))
          .filter((r): r is NonNullable<typeof r> => r !== undefined)
          .map(toApiProduct);
        return {
          data: { products },
          meta: { page: params.page, pageSize: params.pageSize, total: hit.total },
        };
      }
    }

    // Fallback / filtros: busca ILIKE + filtros no Postgres.
    const where = this.buildSearchWhere(params);
    const orderBy = SORT_ORDER[params.sortBy ?? ''] ?? [{ id: 'asc' }];
    const [total, rows] = await Promise.all([
      this.db.product.count({ where }),
      this.db.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);
    return {
      data: { products: rows.map(toApiProduct) },
      meta: { page: params.page, pageSize: params.pageSize, total },
    };
  }

  private buildSearchWhere(params: SearchParams): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { published: true };
    const q = params.q?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { category: { is: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.brand) where.brand = { equals: params.brand, mode: 'insensitive' };
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = {
        ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
        ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
      };
    }
    if (params.minRating !== undefined) where.rating = { gte: params.minRating };
    if (params.freeShipping) where.isFreeShipping = true;
    if (params.express) where.isExpress = true;
    return where;
  }

  async suggestions(q?: string) {
    const term = q?.trim();
    const nameFilter = term ? { contains: term, mode: 'insensitive' as const } : undefined;
    const [products, categories, brandRows] = await Promise.all([
      this.db.product.findMany({
        where: { published: true, ...(nameFilter ? { name: nameFilter } : {}) },
        select: { name: true },
        orderBy: { reviewCount: 'desc' },
        take: MAX_SUGGESTIONS,
      }),
      this.db.category.findMany({
        where: nameFilter ? { name: nameFilter } : undefined,
        select: { name: true },
        orderBy: { sortOrder: 'asc' },
        take: MAX_SUGGESTIONS,
      }),
      this.db.product.findMany({
        where: { published: true, brand: { not: null } },
        select: { brand: true },
        distinct: ['brand'],
      }),
    ]);
    const suggestions = [
      ...new Set([...products.map((p) => p.name), ...categories.map((c) => c.name)]),
    ].slice(0, MAX_SUGGESTIONS);
    const brands = brandRows.map((r) => r.brand).filter((b): b is string => Boolean(b));
    return { suggestions, brands };
  }

  async filtersMetadata() {
    const [brandRows, priceAgg] = await Promise.all([
      this.db.product.findMany({
        where: { published: true, brand: { not: null } },
        select: { brand: true },
        distinct: ['brand'],
        orderBy: { brand: 'asc' },
      }),
      this.db.product.aggregate({
        where: { published: true },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);
    return {
      brands: brandRows.map((r) => r.brand).filter((b): b is string => Boolean(b)),
      priceRange: { min: money(priceAgg._min.price), max: money(priceAgg._max.price) },
      sortOptions: [
        { value: 'relevance', label: 'Relevância' },
        { value: 'price_asc', label: 'Menor preço' },
        { value: 'price_desc', label: 'Maior preço' },
        { value: 'rating', label: 'Melhor avaliados' },
        { value: 'discount', label: 'Maior desconto' },
      ],
      ratingOptions: [4, 3, 2, 1],
      flags: [
        { key: 'freeShipping', label: 'Frete grátis' },
        { key: 'express', label: 'Entrega expressa' },
      ],
    };
  }
}
