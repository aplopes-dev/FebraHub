import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { cityboxApi } from '@/api/citybox-api';
import { useUI } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PanelCard } from '@/components/shared/layout-primitives';
import {
  getSortLabel,
  type SearchFilters,
  type SortOption,
} from '@/utils/search';

const SORT_OPTIONS: SortOption[] = ['RELEVANCE', 'PRICE_ASC', 'PRICE_DESC', 'BEST_SELLERS'];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-extrabold">{title}</div>
      {children}
    </div>
  );
}

function FiltersForm({
  draft,
  onChange,
  brands,
  large,
}: {
  draft: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  brands: string[];
  large?: boolean;
}) {
  const { t } = useTranslation(['search', 'common']);
  const textSize = large ? 'text-sm' : 'text-[13px]';

  const priceRanges: { min: number | null; max: number | null; label: string }[] = [
    { min: null, max: null, label: t('filters.all') },
    { min: null, max: 250, label: t('filters.priceUpTo250') },
    { min: 250, max: 1000, label: t('filters.price250to1000') },
    { min: 1000, max: null, label: t('filters.priceOver1000') },
  ];

  const ratingOptions: { value: number | null; label: string }[] = [
    { value: null, label: t('filters.ratingAny') },
    { value: 4, label: t('filters.rating4Plus') },
    { value: 3, label: t('filters.rating3Plus') },
  ];

  return (
    <div className="flex flex-col gap-5">
      <FilterSection title={t('filters.sortBy')}>
        <RadioGroup
          value={draft.sortBy}
          onValueChange={(v) => onChange({ ...draft, sortBy: v as SortOption })}
          className="gap-1"
        >
          {SORT_OPTIONS.map((option) => (
            <label key={option} className={`flex cursor-pointer items-center gap-2 py-1 ${textSize}`}>
              <RadioGroupItem value={option} id={`sort-${option}`} />
              <Label htmlFor={`sort-${option}`} className="font-normal">
                {getSortLabel(option)}
              </Label>
            </label>
          ))}
        </RadioGroup>
      </FilterSection>

      <hr className="border-black/5" />

      <FilterSection title={t('filters.priceRange')}>
        <RadioGroup
          value={`${draft.minPrice ?? 'n'}-${draft.maxPrice ?? 'n'}`}
          onValueChange={(v) => {
            const [minStr, maxStr] = v.split('-');
            onChange({
              ...draft,
              minPrice: minStr === 'n' ? null : Number(minStr),
              maxPrice: maxStr === 'n' ? null : Number(maxStr),
            });
          }}
          className="gap-1"
        >
          {priceRanges.map(({ min, max, label }) => {
            const key = `${min ?? 'n'}-${max ?? 'n'}`;
            return (
              <label key={key} className={`flex cursor-pointer items-center gap-2 py-1 ${textSize}`}>
                <RadioGroupItem value={key} id={`price-${key}`} />
                <Label htmlFor={`price-${key}`} className="font-normal">
                  {label}
                </Label>
              </label>
            );
          })}
        </RadioGroup>
      </FilterSection>

      <hr className="border-black/5" />

      <FilterSection title={t('filters.brand')}>
        <RadioGroup
          value={draft.brand ?? '__all__'}
          onValueChange={(v) => onChange({ ...draft, brand: v === '__all__' ? null : v })}
          className="gap-1"
        >
          <label className={`flex cursor-pointer items-center gap-2 py-1 ${textSize}`}>
            <RadioGroupItem value="__all__" id="brand-all" />
            <Label htmlFor="brand-all" className="font-normal">
              {t('filters.allBrands')}
            </Label>
          </label>
          {brands.map((brand) => (
            <label key={brand} className={`flex cursor-pointer items-center gap-2 py-1 ${textSize}`}>
              <RadioGroupItem value={brand} id={`brand-${brand}`} />
              <Label htmlFor={`brand-${brand}`} className="font-normal">
                {brand}
              </Label>
            </label>
          ))}
        </RadioGroup>
      </FilterSection>

      <hr className="border-black/5" />

      <FilterSection title={t('filters.minRating')}>
        <RadioGroup
          value={draft.minRating == null ? 'any' : String(draft.minRating)}
          onValueChange={(v) =>
            onChange({ ...draft, minRating: v === 'any' ? null : Number(v) })
          }
          className="gap-1"
        >
          {ratingOptions.map(({ value, label }) => (
            <label
              key={label}
              className={`flex cursor-pointer items-center gap-2 py-1 ${textSize}`}
            >
              <RadioGroupItem value={value == null ? 'any' : String(value)} id={`rating-${label}`} />
              <Label htmlFor={`rating-${label}`} className="font-normal">
                {label}
              </Label>
            </label>
          ))}
        </RadioGroup>
      </FilterSection>

      <hr className="border-black/5" />

      <FilterSection title={t('filters.shipping')}>
        <div className="flex flex-col gap-2.5">
          <label className={`flex cursor-pointer items-center gap-2 ${textSize}`}>
            <Checkbox
              checked={draft.freeShippingOnly}
              onCheckedChange={() =>
                onChange({ ...draft, freeShippingOnly: !draft.freeShippingOnly })
              }
            />
            <Label className="font-normal">{t('filters.freeShipping')}</Label>
          </label>
          <label className={`flex cursor-pointer items-center gap-2 ${textSize}`}>
            <Checkbox
              checked={draft.expressOnly}
              onCheckedChange={() => onChange({ ...draft, expressOnly: !draft.expressOnly })}
            />
            <Label className="font-normal">{t('filters.express')}</Label>
          </label>
        </div>
      </FilterSection>
    </div>
  );
}

export function ShippingFilters({ large }: { large?: boolean }) {
  const { t } = useTranslation('search');
  const { searchFilters, setSearchFilters } = useUI();
  const textSize = large ? 'text-sm' : 'text-[13px]';

  return (
    <FilterSection title={t('filters.shipping')}>
      <div className="flex flex-col gap-2.5">
        <label className={`flex cursor-pointer items-center gap-2 ${textSize}`}>
          <Checkbox
            checked={searchFilters.freeShippingOnly}
            onCheckedChange={() =>
              setSearchFilters({
                ...searchFilters,
                freeShippingOnly: !searchFilters.freeShippingOnly,
              })
            }
          />
          <Label className="font-normal">{t('filters.freeShipping')}</Label>
        </label>
        <label className={`flex cursor-pointer items-center gap-2 ${textSize}`}>
          <Checkbox
            checked={searchFilters.expressOnly}
            onCheckedChange={() =>
              setSearchFilters({ ...searchFilters, expressOnly: !searchFilters.expressOnly })
            }
          />
          <Label className="font-normal">{t('filters.expressTomorrow')}</Label>
        </label>
      </div>
    </FilterSection>
  );
}

export function PriceFilters({ large }: { large?: boolean }) {
  const { t } = useTranslation('search');
  const { searchFilters, setSearchFilters } = useUI();
  const textSize = large ? 'text-sm' : 'text-[13px]';

  const priceRanges: { min: number | null; max: number | null; label: string }[] = [
    { min: null, max: null, label: t('filters.all') },
    { min: null, max: 250, label: t('filters.priceUpTo250') },
    { min: 250, max: 1000, label: t('filters.price250to1000') },
    { min: 1000, max: null, label: t('filters.priceOver1000') },
  ];

  return (
    <FilterSection title={t('filters.price')}>
      <div className={`flex flex-col gap-2 ${textSize} text-foreground`}>
        {priceRanges.map(({ min, max, label }) => {
          const selected = searchFilters.minPrice === min && searchFilters.maxPrice === max;
          return (
            <button
              key={label}
              type="button"
              className={`cursor-pointer text-left ${selected ? 'font-bold text-foreground' : ''}`}
              onClick={() => setSearchFilters({ ...searchFilters, minPrice: min, maxPrice: max })}
            >
              {label}
            </button>
          );
        })}
      </div>
    </FilterSection>
  );
}

export function SearchFilterSidebar({
  filters: controlledFilters,
  onApply,
  brands: controlledBrands,
}: {
  filters?: SearchFilters;
  onApply?: (filters: SearchFilters) => void;
  brands?: string[];
} = {}) {
  const { t } = useTranslation('search');
  const { searchFilters, setSearchFilters } = useUI();
  const filters = controlledFilters ?? searchFilters;
  const applyFilters = onApply ?? setSearchFilters;
  const [draft, setDraft] = useState(filters);
  const [fetchedBrands, setFetchedBrands] = useState<string[]>([]);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  useEffect(() => {
    if (controlledBrands != null) return;
    cityboxApi
      .getFiltersMetadata()
      .then((meta) => setFetchedBrands(meta.brands ?? []))
      .catch(() => setFetchedBrands([]));
  }, [controlledBrands]);

  const brands = controlledBrands ?? fetchedBrands;

  return (
    <aside className="sticky top-[120px] flex flex-col gap-5 rounded-xl bg-card p-[18px] shadow-[0_1px_6px_rgba(0,0,0,0.07)]">
      <FiltersForm draft={draft} onChange={setDraft} brands={brands} />
      <Button
        className="h-[46px] w-full rounded-lg text-[15px] font-bold"
        onClick={() => applyFilters(draft)}
      >
        {t('filters.apply')}
      </Button>
    </aside>
  );
}

export function SearchSuggestionsPanel({
  onSelect,
}: {
  onSelect: (term: string) => void;
}) {
  const { t } = useTranslation(['search', 'common']);
  const { searchHistory, clearSearchHistory } = useUI();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    cityboxApi
      .searchSuggestions()
      .then((data) => setSuggestions(data.suggestions ?? []))
      .catch(() => setSuggestions([]));
  }, []);

  return (
    <PanelCard className="mb-4 p-5">
      {searchHistory.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-extrabold">
              <Clock className="size-4" />
              {t('recentSearches', { ns: 'search' })}
            </div>
            <button
              type="button"
              className="cursor-pointer text-xs font-bold text-success"
              onClick={clearSearchHistory}
            >
              {t('actions.clear', { ns: 'common' })}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term) => (
              <button
                key={term}
                type="button"
                className="cursor-pointer rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-medium hover:bg-black/[0.08]"
                onClick={() => onSelect(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-base font-extrabold">{t('suggestions', { ns: 'search' })}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="cursor-pointer rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-medium hover:bg-black/[0.08]"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </PanelCard>
  );
}

export function FilterSheet({
  open: controlledOpen,
  onOpenChange,
  filters: controlledFilters,
  onApply,
  onReset,
  brands: controlledBrands,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  filters?: SearchFilters;
  onApply?: (filters: SearchFilters) => void;
  onReset?: () => void;
  brands?: string[];
} = {}) {
  const { t } = useTranslation(['search', 'common']);
  const {
    filtersOpen,
    closeFilters,
    searchFilters,
    setSearchFilters,
    resetSearchFilters,
  } = useUI();
  const open = controlledOpen ?? filtersOpen;
  const filters = controlledFilters ?? searchFilters;
  const applyFilters = onApply ?? setSearchFilters;
  const resetFilters = onReset ?? resetSearchFilters;
  const close = () => (onOpenChange ? onOpenChange(false) : closeFilters());
  const [draft, setDraft] = useState(filters);
  const [fetchedBrands, setFetchedBrands] = useState<string[]>([]);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  useEffect(() => {
    if (!open || controlledBrands != null) return;
    cityboxApi
      .getFiltersMetadata()
      .then((meta) => setFetchedBrands(meta.brands ?? []))
      .catch(() => setFetchedBrands([]));
  }, [open, controlledBrands]);

  const brands = controlledBrands ?? fetchedBrands;

  const apply = () => {
    applyFilters(draft);
    close();
  };

  const clear = () => {
    resetFilters();
    close();
  };

  const handleOpenChange = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else if (!next) closeFilters();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="flex w-[min(100%,360px)] max-w-[calc(100vw-24px)] animate-cbslide flex-col gap-4 rounded-2xl border border-black/8 px-6 pt-7 pb-6 shadow-xl data-[side=left]:top-3 data-[side=left]:bottom-3 data-[side=left]:left-3 data-[side=left]:h-auto data-[side=left]:max-h-[calc(100dvh-24px)] sm:max-w-[360px]"
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 p-0 pr-10">
          <SheetTitle className="text-[17px] font-extrabold">
            {t('filters.sheetTitle', { ns: 'search' })}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-1">
          <FiltersForm draft={draft} onChange={setDraft} brands={brands} large />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="h-[46px] flex-1 rounded-lg font-bold" onClick={clear}>
            {t('actions.clear', { ns: 'common' })}
          </Button>
          <Button className="h-[46px] flex-1 rounded-lg font-bold" onClick={apply}>
            {t('actions.apply', { ns: 'common' })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
