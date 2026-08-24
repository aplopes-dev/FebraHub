'use client';

import { useEffect, useState } from 'react';

export function useDebouncedStoresSearch(debounceMs = 500, minLength = 3) {
  const [search, setSearch] = useState('');
  const [apiSearch, setApiSearch] = useState<string | undefined>(undefined);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length > 0 && trimmed.length < minLength) {
      setApiSearch(undefined);
      return;
    }

    const handle = setTimeout(() => {
      setApiSearch(trimmed.length >= minLength ? trimmed : undefined);
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [search, debounceMs, minLength]);

  return { search, setSearch, apiSearch };
}
