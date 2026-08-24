import { useTranslation } from 'react-i18next';
import { ArrowUpDown, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUI } from '@/context/AppContext';
import { getSortLabel, type SortOption } from '@/utils/search';

export function SearchToolbar({
  resultCount,
  query,
  subject,
  showFilterBtn,
  onOpenFilters,
  sortBy,
}: {
  resultCount: number;
  query?: string;
  /** Rótulo exibido após "X resultados para" (ex.: nome da categoria). */
  subject?: string;
  showFilterBtn?: boolean;
  onOpenFilters?: () => void;
  sortBy?: SortOption;
}) {
  const { t } = useTranslation('search');
  const ui = useUI();
  const openFilters = onOpenFilters ?? ui.openFilters;
  const activeSort = sortBy ?? ui.searchFilters.sortBy;

  const displaySubject =
    subject ??
    (query?.trim() ? `"${query.trim()}"` : t('allProducts'));

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">
        {t('resultsFor', { count: resultCount })}{' '}
        <strong className="text-[rgba(0,0,0,0.9)]">{displaySubject}</strong>
      </div>
      <div className="flex items-center gap-2.5">
        {showFilterBtn && (
          <Button
            type="button"
            variant="outline"
            className="h-auto rounded-lg px-3.5 py-2 text-[13px] font-bold"
            onClick={openFilters}
          >
            <SlidersHorizontal className="size-[15px]" />
            {t('filter')}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-lg px-3.5 py-2 text-[13px] font-semibold text-[rgba(0,0,0,0.75)]"
          onClick={openFilters}
        >
          <ArrowUpDown className="mr-1 size-[14px]" />
          {getSortLabel(activeSort)}
          <ChevronDown className="size-[13px]" />
        </Button>
      </div>
    </div>
  );
}
