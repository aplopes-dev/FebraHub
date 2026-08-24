import { SearchRepository, type SearchHitRow, type SearchScope } from './search.repository';

/**
 * Match em memória para specs — substring AND nos campos indexados do FTS.
 */
export class InMemorySearchRepository extends SearchRepository {
  private hits: SearchHitRow[] = [];

  seed(hits: readonly SearchHitRow[]): void {
    this.hits = [...hits];
  }

  async search(
    _storeId: string,
    tsq: string,
    limit: number,
    scope: SearchScope,
  ): Promise<SearchHitRow[]> {
    const tokens = tsq
      .split('&')
      .map((part) => part.trim().replace(/:\*$/, '').toLowerCase())
      .filter(Boolean);

    const allowedTypes = new Set<SearchHitRow['type']>();
    if (scope.includePatients) allowedTypes.add('patient');
    if (scope.includeAppointments) allowedTypes.add('appointment');
    if (
      scope.includeOpportunities &&
      scope.visibleFunnelIds !== undefined &&
      scope.visibleFunnelIds.length === 0
    ) {
      // skip opportunities
    } else if (scope.includeOpportunities) {
      allowedTypes.add('opportunity');
    }
    if (scope.includeStock) allowedTypes.add('stock_product');

    const matched = this.hits.filter((hit) => {
      if (!allowedTypes.has(hit.type)) return false;
      const haystack = [hit.title, hit.subtitle ?? '', hit.href]
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '');
      return tokens.every((token) => haystack.includes(token));
    });

    return matched.slice(0, limit);
  }
}
