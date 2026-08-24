import { matchesQueryText } from '@/features/search/utils/match-query';
import {
  filterFaqsByCategory,
  type HelpFaqCategoryFilter,
  type HelpFaqItem,
} from './faq-data';
import type { HelpModule } from './help-content';

export type HelpCatalogFilter = {
  modules: readonly HelpModule[];
  faqs: readonly HelpFaqItem[];
};

export function faqMatchesQuery(item: HelpFaqItem, query: string): boolean {
  return matchesQueryText(
    [item.question, item.answer, ...item.tags].join(' '),
    query,
  );
}

export function filterFaqs(
  faqs: readonly HelpFaqItem[],
  options: { query: string; category: HelpFaqCategoryFilter },
): HelpFaqItem[] {
  const byCategory = filterFaqsByCategory(faqs, options.category);
  const trimmed = options.query.trim();
  if (!trimmed) return byCategory;
  return byCategory.filter((item) => faqMatchesQuery(item, trimmed));
}

export function filterHelpCatalog(
  query: string,
  catalog: HelpCatalogFilter,
): HelpCatalogFilter {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      modules: [...catalog.modules],
      faqs: [...catalog.faqs],
    };
  }

  return {
    modules: catalog.modules.filter((module) =>
      matchesQueryText(
        [module.title, module.description, ...module.keywords].join(' '),
        trimmed,
      ),
    ),
    faqs: catalog.faqs.filter((item) => faqMatchesQuery(item, trimmed)),
  };
}
