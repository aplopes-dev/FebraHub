/**
 * Busca global — entidades via `GET /v1/search` (FTS) + catálogo de páginas no client.
 */
import { imoveisFetch } from '@/lib/imoveis-api';
import type { NavItem } from '@/features/shared/data/navigation';
import {
  hitFromSearchablePage,
  SEARCHABLE_PAGES,
} from '../data/searchable-pages';
import type {
  GlobalSearchGroup,
  GlobalSearchHit,
  GlobalSearchHitType,
  GlobalSearchResult,
} from '../types';
import { matchesQueryText } from '../utils/match-query';
import { hitFromNav } from '../utils/map-hits';

const PER_TYPE = 15;

export type GlobalSearchOptions = {
  canAccessHref?: (href: string) => boolean;
  agentId?: string;
};

type ApiSearchHit = {
  id: string;
  type: GlobalSearchHitType;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string[];
};

type ApiSearchResponse = {
  groups: Array<{
    heading: string;
    hits: ApiSearchHit[];
  }>;
};

function filterByAccess(
  href: string,
  canAccessHref?: (href: string) => boolean,
): boolean {
  if (!canAccessHref) return true;
  const pathOnly = href.split('?')[0] ?? href;
  return canAccessHref(href) || canAccessHref(pathOnly);
}

function hitMatchesQuery(hit: GlobalSearchHit, query: string): boolean {
  return matchesQueryText(
    [hit.title, hit.subtitle ?? '', ...(hit.keywords ?? [])].join(' '),
    query,
  );
}

function pagesGroup(
  query: string,
  canAccessHref?: (href: string) => boolean,
): GlobalSearchGroup | null {
  const hits = SEARCHABLE_PAGES.filter((page) =>
    filterByAccess(page.href, canAccessHref),
  )
    .map(hitFromSearchablePage)
    .filter((hit) => (query.trim() ? hitMatchesQuery(hit, query) : true));

  if (hits.length === 0) return null;
  return { heading: 'Páginas', hits };
}

export async function globalSearch(
  query: string,
  navItems: readonly NavItem[] = [],
  options: GlobalSearchOptions = {},
): Promise<GlobalSearchResult> {
  const trimmed = query.trim();
  const { canAccessHref, agentId } = options;

  if (!trimmed) {
    const pages = pagesGroup('', canAccessHref);
    const navHits = navItems
      .filter((item) => filterByAccess(item.href, canAccessHref))
      .map(hitFromNav);
    const groups: GlobalSearchGroup[] = [];
    if (navHits.length > 0) {
      groups.push({ heading: 'Navegação', hits: navHits });
    }
    if (pages) {
      const navHrefs = new Set(navHits.map((h) => h.href));
      const extra = pages.hits.filter((h) => !navHrefs.has(h.href));
      if (extra.length > 0) {
        groups.push({ heading: 'Atalhos', hits: extra });
      }
    }
    return { groups };
  }

  const params = new URLSearchParams({
    q: trimmed,
    perType: String(PER_TYPE),
  });
  if (agentId) params.set('agentId', agentId);

  const api = await imoveisFetch<ApiSearchResponse>(
    `/v1/search?${params.toString()}`,
  );

  const groups: GlobalSearchGroup[] = (api.groups ?? []).map((group) => ({
    heading: group.heading,
    hits: group.hits.map(
      (hit): GlobalSearchHit => ({
        id: hit.id,
        type: hit.type,
        title: hit.title,
        subtitle: hit.subtitle,
        href: hit.href,
        keywords: hit.keywords,
      }),
    ),
  }));

  const pages = pagesGroup(trimmed, canAccessHref);
  if (pages) {
    groups.push(pages);
  }

  return { groups };
}
