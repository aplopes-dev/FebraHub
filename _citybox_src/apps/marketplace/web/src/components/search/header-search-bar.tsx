import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUI } from '@/context/AppContext';

export function HeaderSearchBar() {
  const { t } = useTranslation('search');
  const { query, setQuery, doSearch } = useUI();

  return (
    <form
      onSubmit={doSearch}
      className="flex h-[42px] min-w-0 flex-1 items-center rounded-lg bg-white pr-1.5 pl-3.5"
    >
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('placeholder')}
        className="h-auto flex-1 border-0 bg-transparent px-0 text-sm text-black shadow-none ring-0 placeholder:text-black/45 focus-visible:ring-0"
      />
      <button
        type="submit"
        aria-label={t('submitAria')}
        className="flex cursor-pointer border-l border-black/[0.08] p-2 text-black/50"
      >
        <Search className="size-[18px]" />
      </button>
    </form>
  );
}
