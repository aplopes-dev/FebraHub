import { clinicaFetch } from '@/features/clinic/shared/api/clinica-client';
import type {
  GlobalSearchGroup,
  GlobalSearchHit,
  GlobalSearchHitType,
  GlobalSearchResult,
} from '../types';

type ApiSearchHitType =
  | 'patient'
  | 'appointment'
  | 'opportunity'
  | 'stock_product';

type ApiSearchHit = {
  id: string;
  type: ApiSearchHitType;
  title: string;
  subtitle?: string | null;
  href: string;
};

type ApiSearchResponse = {
  groups: Array<{
    heading: string;
    hits: ApiSearchHit[];
  }>;
};

function mapApiHitType(type: ApiSearchHitType): GlobalSearchHitType {
  if (type === 'stock_product') return 'stock';
  return type;
}

function mapApiHit(hit: ApiSearchHit): GlobalSearchHit {
  return {
    id: hit.id,
    type: mapApiHitType(hit.type),
    title: hit.title,
    subtitle: hit.subtitle ?? undefined,
    href: hit.href,
  };
}

export async function searchClinicEntities(
  storeId: string,
  query: string,
  options?: { perType?: number },
): Promise<GlobalSearchResult> {
  const params = new URLSearchParams({
    q: query,
    perType: String(options?.perType ?? 5),
  });

  const api = await clinicaFetch<ApiSearchResponse>(
    storeId,
    `/v1/search?${params.toString()}`,
  );

  const groups: GlobalSearchGroup[] = (api.groups ?? []).map((group) => ({
    heading: group.heading,
    hits: group.hits.map(mapApiHit),
  }));

  return { groups };
}
