"use client";

import { useCallback, useState } from "react";
import { usePosCashSessionsQuery } from "@/features/pos-cash-sessions/hooks/use-pos-cash-session-queries";
import {
  createEmptyPosCashFilters,
  type PosCashSessionFilters,
  type PosCashSessionListResult,
} from "@/features/pos-cash-sessions/types/pos-cash-session";

const DEFAULT_PER_PAGE = 10;

const EMPTY_RESULT: PosCashSessionListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 0 },
};

export function usePosCashSessionList() {
  const [draftFilters, setDraftFilters] = useState<PosCashSessionFilters>(
    createEmptyPosCashFilters,
  );
  const [appliedFilters, setAppliedFilters] = useState<PosCashSessionFilters>(
    createEmptyPosCashFilters,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const query = usePosCashSessionsQuery({
    filters: appliedFilters,
    page,
    perPage,
  });

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setPage(1);
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    const empty = createEmptyPosCashFilters();
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  }, []);

  const result: PosCashSessionListResult = query.data ?? EMPTY_RESULT;

  return {
    draftFilters,
    setDraftFilters,
    appliedFilters,
    applyFilters,
    clearFilters,
    page,
    setPage,
    perPage,
    setPerPage: (next: number) => {
      setPerPage(next);
      setPage(1);
    },
    result,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}
