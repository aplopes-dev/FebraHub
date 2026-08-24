"use client";

import { useEffect, useState } from "react";
import { usePromotionsQuery } from "@/features/promotions/hooks/use-promotion-queries";
import type { PromotionListTab } from "@/features/promotions/types/promotion";

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export function usePromotionList() {
  const [tab, setTab] = useState<PromotionListTab>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(DEFAULT_PER_PAGE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = usePromotionsQuery({
    tab,
    search: debouncedSearch,
    page,
    perPage,
  });

  const result = query.data ?? {
    data: [],
    meta: { total: 0, page, perPage, totalPages: 1 },
    tabCounts: { active: 0, deleted: 0 },
  };

  return {
    tab,
    setTab: (next: PromotionListTab) => {
      setTab(next);
      setPageState(1);
    },
    search,
    setSearch,
    page,
    setPage: setPageState,
    perPage,
    setPerPage: (next: number) => {
      setPerPageState(next);
      setPageState(1);
    },
    result,
    isLoading: query.isLoading,
    refresh: () => {
      void query.refetch();
    },
  };
}
