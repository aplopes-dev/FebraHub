import Typesense from 'typesense';
import { config } from '../config.js';

export function createTypesenseClient() {
  return new Typesense.Client({
    nodes: [
      {
        host: config.typesense.host,
        port: config.typesense.port,
        protocol: config.typesense.protocol,
      },
    ],
    apiKey: config.typesense.apiKey,
    connectionTimeoutSeconds: 3,
  });
}

export const PRODUCTS_COLLECTION = config.typesense.productsCollection;

export const PRODUCTS_SCHEMA = {
  name: PRODUCTS_COLLECTION,
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'name', type: 'string' as const },
    { name: 'brand', type: 'string' as const, optional: true },
    { name: 'category', type: 'string' as const, facet: true },
    { name: 'categoryId', type: 'string' as const, facet: true },
    { name: 'price', type: 'float' as const },
    { name: 'rating', type: 'float' as const },
    { name: 'published', type: 'bool' as const },
  ],
};

export interface ProductSearchHit {
  id: string;
}

/**
 * Busca ids de produtos no Typesense. Retorna null quando o Typesense está
 * indisponível — o chamador DEVE cair para a busca Postgres (ILIKE).
 */
export async function searchProductIds(
  client: ReturnType<typeof createTypesenseClient>,
  q: string,
  opts: { categoryId?: string; page: number; pageSize: number },
): Promise<{ ids: string[]; total: number } | null> {
  try {
    const filterBy: string[] = ['published:=true'];
    if (opts.categoryId) filterBy.push(`categoryId:=${opts.categoryId}`);
    const result = await client
      .collections(PRODUCTS_COLLECTION)
      .documents()
      .search({
        q: q || '*',
        query_by: 'name,brand,category',
        filter_by: filterBy.join(' && '),
        page: opts.page,
        per_page: opts.pageSize,
      });
    return {
      ids: (result.hits ?? []).map((h) => (h.document as ProductSearchHit).id),
      total: result.found ?? 0,
    };
  } catch {
    return null;
  }
}
