import { http, type HttpHandler } from 'msw';
import { SEARCH_SUGGESTIONS } from '@/data/mock';
import {
  buildFavorites,
  db,
  findProduct,
  nextId,
  persistDb,
  searchProducts,
  SEED_CATEGORIES,
  SEED_HOME,
  SEED_PRODUCTS,
} from '../db';
import { filtersMetadata, reviewsSummary } from '../checkout-logic';
import { errorResponse, ok, okWithMeta, noContent, parseJson, requireAuth } from './shared';

export const catalogHandlers: HttpHandler[] = [
  http.get('*/catalog/home', () => ok(SEED_HOME)),

  http.get('*/catalog/categories', () => ok({ categories: SEED_CATEGORIES })),

  http.get('*/catalog/categories/:categoryId/products', ({ params, request }) => {
    const categoryId = String(params.categoryId);
    const category = SEED_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.category');
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const all = SEED_PRODUCTS.filter((p) => p.categoryId === categoryId);
    const start = (page - 1) * pageSize;
    const products = all.slice(start, start + pageSize);

    return okWithMeta(
      { category, products },
      { page, pageSize, total: all.length },
    );
  }),

  http.get('*/catalog/search', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const all = searchProducts({
      q: url.searchParams.get('q'),
      minPrice: url.searchParams.get('minPrice'),
      maxPrice: url.searchParams.get('maxPrice'),
      minRating: url.searchParams.get('minRating'),
      freeShipping: url.searchParams.get('freeShipping'),
      express: url.searchParams.get('express'),
      brand: url.searchParams.get('brand'),
      sortBy: url.searchParams.get('sortBy'),
    });
    const start = (page - 1) * pageSize;
    const products = all.slice(start, start + pageSize);
    return okWithMeta({ products }, { page, pageSize, total: all.length });
  }),

  http.get('*/catalog/products/:id', ({ params }) => {
    const product = findProduct(String(params.id));
    if (!product) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.product');
    }
    return ok({ product });
  }),

  http.get('*/catalog/filters/metadata', () => ok(filtersMetadata())),

  http.get('*/catalog/search/suggestions', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
    const suggestions = q
      ? SEARCH_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q))
      : SEARCH_SUGGESTIONS;
    const brands = [...new Set(SEED_PRODUCTS.map((p) => p.brand).filter(Boolean))] as string[];
    return ok({ suggestions, brands });
  }),

  http.get('*/catalog/products/:productId/reviews', ({ params, request }) => {
    const productId = String(params.productId);
    if (!findProduct(productId)) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.product');
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const summary = reviewsSummary(productId);
    const start = (page - 1) * pageSize;
    const reviews = summary.reviews.slice(start, start + pageSize);

    return okWithMeta(
      {
        averageRating: summary.averageRating,
        totalCount: summary.totalCount,
        distribution: summary.distribution,
        reviews,
      },
      { page, pageSize, total: summary.totalCount },
    );
  }),

  http.post('*/catalog/products/:productId/reviews', async ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const productId = String(params.productId);
    if (!findProduct(productId)) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.product');
    }

    const body = await parseJson<{
      rating?: number;
      text?: string;
      orderId?: string | null;
      photoUrls?: string[];
    }>(request);
    if (!body?.rating || body.rating < 1 || body.rating > 5) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.invalidRating', 'rating');
    }

    const review = {
      id: nextId('r'),
      productId,
      author: db.user.name,
      rating: body.rating,
      date: new Date().toISOString(),
      text: body.text ?? '',
      photoUrls: body.photoUrls ?? [],
    };
    db.reviews[productId] = [...(db.reviews[productId] ?? []), review];
    persistDb();
    return ok({ review }, { status: 201 });
  }),

  http.post(
    '*/catalog/products/:productId/reviews/:reviewId/photos',
    async ({ request, params }) => {
      const unauthorized = requireAuth(request);
      if (unauthorized) return unauthorized;

      const productId = String(params.productId);
      const reviewId = String(params.reviewId);
      const reviews = db.reviews[productId] ?? [];
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) {
        return errorResponse(404, 'NOT_FOUND', 'notFound.review');
      }

      const photoUrl = `https://cdn.citybox.com.br/reviews/${reviewId}.jpg`;
      review.photoUrls = [...(review.photoUrls ?? []), photoUrl];
      persistDb();
      return ok({ photoUrl, review });
    },
  ),

  http.get('*/me/search-history', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok({ queries: db.searchHistory });
  }),

  http.post('*/me/search-history', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{ query?: string }>(request);
    const query = body?.query?.trim();
    if (!query) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'query');
    }

    db.searchHistory = [
      query,
      ...db.searchHistory.filter((q) => q.toLowerCase() !== query.toLowerCase()),
    ].slice(0, 10);
    persistDb();
    return ok({ queries: db.searchHistory });
  }),

  http.delete('*/me/search-history', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    db.searchHistory = [];
    persistDb();
    return noContent();
  }),

  http.get('*/me/favorites', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok(buildFavorites());
  }),

  http.put('*/me/favorites/:id', async ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const productId = String(params.id);
    const body = await parseJson<{ isFavorite?: boolean }>(request);
    if (body?.isFavorite) {
      if (findProduct(productId)) db.favorites.add(productId);
    } else {
      db.favorites.delete(productId);
    }
    persistDb();

    return ok({ productId, isFavorite: Boolean(body?.isFavorite) });
  }),
];
