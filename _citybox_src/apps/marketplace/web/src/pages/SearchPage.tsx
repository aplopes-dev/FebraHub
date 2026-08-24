import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { screenLabel } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useCatalog, useUI } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import { ProductGrid } from '@/components/product/product-card';
import {
  FilterSheet,
  SearchFilterSidebar,
  SearchSuggestionsPanel,
} from '@/components/search/filter-panels';
import { SearchToolbar } from '@/components/search/search-toolbar';
import { EmptyState } from '@/components/shared/empty-state';
import { TwoColumnLayout } from '@/components/shared/layout-primitives';

export function SearchPage() {
  const { t } = useTranslation('search');
  const location = useLocation();
  const { searchQuery, setSearchQuery, setQuery, addSearchHistory } = useUI();
  const { searchList, openProduct } = useCatalog();
  const { cardMin, listCols, showSearchSidebar, showFilterBtn } = useLayout();
  const showSuggestions = !searchQuery.trim();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.key]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = window.setTimeout(() => addSearchHistory(searchQuery), 600);
      return () => window.clearTimeout(timer);
    }
  }, [searchQuery, addSearchHistory]);

  const handleSelectTerm = (term: string) => {
    setSearchQuery(term);
    setQuery('');
    addSearchHistory(term);
  };

  return (
    <div data-screen-label={screenLabel('search')}>
      {showSuggestions && <SearchSuggestionsPanel onSelect={handleSelectTerm} />}
      <SearchToolbar resultCount={searchList.length} query={searchQuery} showFilterBtn={showFilterBtn} />
      {searchList.length === 0 && !showSuggestions ? (
        <EmptyState
          icon={Search}
          title={t('empty.title')}
          description={t('empty.description')}
          actionLabel={t('empty.action')}
          onAction={() => setSearchQuery('')}
        />
      ) : (
        !showSuggestions && (
          <TwoColumnLayout columns={listCols}>
            {showSearchSidebar && <SearchFilterSidebar />}
            <ProductGrid
              products={searchList}
              variant="search"
              cardMin={cardMin}
              className="min-w-0"
              onOpen={openProduct}
            />
          </TwoColumnLayout>
        )
      )}
      <FilterSheet />
    </div>
  );
}
