/**
 * Busca global — navegação/atalhos no client + entidades via FTS (`GET /v1/search`).
 */
import type { VerticalNavModule } from '@/lib/vertical/types';
import {
  hitFromSearchablePage,
  SEARCHABLE_PAGES,
} from '../data/searchable-pages';
import type {
  GlobalSearchGroup,
  GlobalSearchHit,
  GlobalSearchResult,
} from '../types';
import { flattenNavModules } from '../utils/map-hits';
import { matchesQueryText } from '../utils/match-query';
import { searchClinicEntities } from './clinic-search.api.service';

const PER_GROUP = 5;
const MIN_REMOTE_QUERY_LENGTH = 2;

export type ClinicGlobalSearchOptions = {
  storeId: string;
  canAccessHref?: (href: string) => boolean;
  canSearchPatients?: boolean;
  canSearchOpportunities?: boolean;
  canSearchAppointments?: boolean;
  canSearchStock?: boolean;
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
  return { heading: 'Atalhos', hits };
}

function navigationGroup(
  navModules: readonly VerticalNavModule[],
  query: string,
  canAccessHref?: (href: string) => boolean,
): GlobalSearchGroup | null {
  const hits = flattenNavModules(navModules)
    .filter((hit) => filterByAccess(hit.href, canAccessHref))
    .filter((hit) => (query.trim() ? hitMatchesQuery(hit, query) : true));

  if (hits.length === 0) return null;
  return { heading: 'Navegação', hits };
}

function appendUniqueShortcuts(
  groups: GlobalSearchGroup[],
  navHits: readonly GlobalSearchHit[],
  pages: GlobalSearchGroup | null,
): void {
  if (!pages) return;
  const navHrefs = new Set(navHits.map((hit) => hit.href.split('?')[0] ?? hit.href));
  const extra = pages.hits.filter((hit) => {
    const path = hit.href.split('?')[0] ?? hit.href;
    return !navHrefs.has(path) && !navHrefs.has(hit.href);
  });
  if (extra.length === 0) return;
  groups.push({ heading: pages.heading, hits: extra });
}

function hasRemoteSearch(options: ClinicGlobalSearchOptions): boolean {
  return (
    options.canSearchPatients === true ||
    options.canSearchOpportunities === true ||
    options.canSearchAppointments === true ||
    options.canSearchStock === true
  );
}

export async function clinicGlobalSearch(
  query: string,
  navModules: readonly VerticalNavModule[],
  options: ClinicGlobalSearchOptions,
): Promise<GlobalSearchResult> {
  const trimmed = query.trim();
  const { storeId, canAccessHref } = options;

  const navGroup = navigationGroup(navModules, trimmed, canAccessHref);
  const pages = pagesGroup(trimmed, canAccessHref);
  const groups: GlobalSearchGroup[] = [];

  if (navGroup) {
    groups.push(navGroup);
  }

  if (!trimmed) {
    if (pages && navGroup) {
      appendUniqueShortcuts(groups, navGroup.hits, pages);
    } else if (pages) {
      groups.push(pages);
    }
    return { groups };
  }

  if (pages && navGroup) {
    appendUniqueShortcuts(groups, navGroup.hits, pages);
  } else if (pages) {
    groups.push(pages);
  }

  if (trimmed.length < MIN_REMOTE_QUERY_LENGTH || !hasRemoteSearch(options)) {
    return { groups };
  }

  try {
    const remote = await searchClinicEntities(storeId, trimmed, {
      perType: PER_GROUP,
    });
    for (const group of remote.groups) {
      if (group.hits.length > 0) {
        groups.push(group);
      }
    }
  } catch {
    // Fallback: nav/atalhos only — no silent fan-out.
  }

  return { groups };
}

/** Expõe helpers para testes unitários. */
export const clinicGlobalSearchInternals = {
  navigationGroup,
  pagesGroup,
  hitMatchesQuery,
  filterByAccess,
  MIN_REMOTE_QUERY_LENGTH,
};
