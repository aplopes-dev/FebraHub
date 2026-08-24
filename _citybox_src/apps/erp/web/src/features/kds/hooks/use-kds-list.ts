"use client";

import { useEffect, useMemo, useState } from "react";
import { useKdsStore } from "@/features/kds/hooks/use-kds-store";
import { selectKdsList } from "@/features/kds/services/kds.service";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export function useKdsList() {
  const items = useKdsStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const result = useMemo(
    () => selectKdsList(items, { search: debouncedSearch, page, perPage }),
    [items, debouncedSearch, page, perPage],
  );

  return {
    search,
    setSearch,
    page,
    setPage,
    perPage,
    setPerPage: (next: number) => {
      setPerPageState(next);
      setPage(1);
    },
    result,
  };
}
