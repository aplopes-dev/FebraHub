"use client";

import { useEffect, useMemo } from "react";
import {
  DEFAULT_PER_PAGE,
  useCustomerListStore,
} from "@/features/customers/store/customer-list.store";
import { useCustomersQuery } from "@/features/customers/hooks/use-customer-queries";
import type { CustomerListResult } from "@/features/customers/types/customer";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: CustomerListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 },
  tabCounts: {
    all: 0,
    lead: 0,
    opportunity: 0,
    active: 0,
    inactive: 0,
  },
};

export function useCustomerList() {
  const tab = useCustomerListStore((state) => state.tab);
  const search = useCustomerListStore((state) => state.search);
  const debouncedSearch = useCustomerListStore(
    (state) => state.debouncedSearch,
  );
  const page = useCustomerListStore((state) => state.page);
  const perPage = useCustomerListStore((state) => state.perPage);
  const selectedIdsList = useCustomerListStore((state) => state.selectedIds);

  const setTab = useCustomerListStore((state) => state.setTab);
  const setSearch = useCustomerListStore((state) => state.setSearch);
  const commitSearch = useCustomerListStore((state) => state.commitSearch);
  const setPage = useCustomerListStore((state) => state.setPage);
  const setPerPage = useCustomerListStore((state) => state.setPerPage);
  const setSelectedIds = useCustomerListStore((state) => state.setSelectedIds);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = window.setTimeout(
      () => commitSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch, commitSearch]);

  const params = useMemo(
    () => ({ tab, search: debouncedSearch, page, perPage }),
    [tab, debouncedSearch, page, perPage],
  );

  const query = useCustomersQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  const selectedIds = useMemo(
    () => new Set(selectedIdsList),
    [selectedIdsList],
  );

  const pageIds = useMemo(
    () => result.data.map((customer) => customer.id),
    [result.data],
  );

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const somePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  function toggleSelectAllPage() {
    if (allPageSelected) {
      setSelectedIds(selectedIdsList.filter((id) => !pageIds.includes(id)));
      return;
    }
    const next = new Set(selectedIdsList);
    for (const id of pageIds) next.add(id);
    setSelectedIds([...next]);
  }

  function toggleSelectOne(id: string) {
    if (selectedIds.has(id)) {
      setSelectedIds(selectedIdsList.filter((item) => item !== id));
      return;
    }
    setSelectedIds([...selectedIdsList, id]);
  }

  return {
    tab,
    setTab,
    search,
    setSearch,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
    selectedIds,
    allPageSelected,
    somePageSelected,
    toggleSelectAllPage,
    toggleSelectOne,
    refresh: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}
