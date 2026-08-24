'use client';

import { useCallback, useState } from 'react';
import { useDebouncedValue } from './use-debounced-value';

/** Delay padrão para busca em listagens (pacientes, orçamentos, etc.). */
export const PATIENT_LIST_SEARCH_DEBOUNCE_MS = 400;

export function useDebouncedSearch(delayMs = PATIENT_LIST_SEARCH_DEBOUNCE_MS) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, delayMs);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearch('');
  }, []);

  return {
    search,
    debouncedSearch,
    handleSearchChange,
    clearSearch,
  };
}
