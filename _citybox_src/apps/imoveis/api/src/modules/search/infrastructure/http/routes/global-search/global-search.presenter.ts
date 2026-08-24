import type { GlobalSearchResult } from '../../../../application/use-cases/global-search/global-search.use-case';

export class GlobalSearchPresenter {
  static toHttp(result: GlobalSearchResult) {
    return {
      groups: result.groups.map((group) => ({
        heading: group.heading,
        hits: group.hits.map((hit) => ({
          id: hit.id,
          type: hit.type,
          title: hit.title,
          subtitle: hit.subtitle ?? undefined,
          href: hit.href,
        })),
      })),
    };
  }
}
