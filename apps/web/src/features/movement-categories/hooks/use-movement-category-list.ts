"use client";

import { useEffect, useMemo, useState } from "react";
import { useMovementCategoriesQuery } from "@/features/movement-categories/hooks/use-movement-category-queries";
import type {
  MovementCategoryListResult,
  MovementCategoryTypeFilter,
} from "@/features/movement-categories/types/movement-category";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: MovementCategoryListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
};

export function useMovementCategoryList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setTypeState] = useState<MovementCategoryTypeFilter>("all");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      type,
      page,
      perPage,
    }),
    [debouncedSearch, type, page, perPage],
  );

  const query = useMovementCategoriesQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  function setType(next: MovementCategoryTypeFilter) {
    setTypeState(next);
    setPageState(1);
  }

  function setPage(next: number) {
    setPageState(next);
  }

  function setPerPage(next: number) {
    setPerPageState(next);
    setPageState(1);
  }

  return {
    search,
    setSearch,
    type,
    setType,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    refresh: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}
