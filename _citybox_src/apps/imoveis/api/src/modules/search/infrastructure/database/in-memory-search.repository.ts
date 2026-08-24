import { SearchRepository, type SearchHitRow } from './search.repository';

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
    _agentId?: string,
  ): Promise<SearchHitRow[]> {
    const tokens = tsq
      .split('&')
      .map((part) => part.trim().replace(/:\*$/, '').toLowerCase())
      .filter(Boolean);

    const matched = this.hits.filter((hit) => {
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
