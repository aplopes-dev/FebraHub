'use client';

import { useEffect, useState } from 'react';

const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_MIN_LENGTH = 3;

export function useDebouncedUsersSearch(
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minLength = DEFAULT_MIN_LENGTH,
) {
  const [search, setSearch] = useState('');
  const [apiSearch, setApiSearch] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = search.trim();
      setApiSearch(trimmed.length >= minLength ? trimmed : undefined);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [search, debounceMs, minLength]);

  return { search, setSearch, apiSearch };
}
