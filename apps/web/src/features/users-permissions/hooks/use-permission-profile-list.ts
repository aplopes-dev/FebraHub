"use client";

import { useEffect, useMemo } from "react";
import {
  DEFAULT_PROFILE_PER_PAGE,
  usePermissionProfileListStore,
} from "@/features/users-permissions/store/permission-profile-list.store";
import { usePermissionProfilesQuery } from "@/features/users-permissions/hooks/use-permission-profile-queries";
import type { PermissionProfileListResult } from "@/features/users-permissions/types/permission-profile";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: PermissionProfileListResult = {
  data: [],
  meta: {
    total: 0,
    page: 1,
    perPage: DEFAULT_PROFILE_PER_PAGE,
    totalPages: 1,
  },
  tabCounts: { active: 0, deleted: 0 },
};

export function usePermissionProfileList() {
  const tab = usePermissionProfileListStore((state) => state.tab);
  const search = usePermissionProfileListStore((state) => state.search);
  const debouncedSearch = usePermissionProfileListStore(
    (state) => state.debouncedSearch,
  );
  const page = usePermissionProfileListStore((state) => state.page);
  const perPage = usePermissionProfileListStore((state) => state.perPage);

  const setTab = usePermissionProfileListStore((state) => state.setTab);
  const setSearch = usePermissionProfileListStore((state) => state.setSearch);
  const commitSearch = usePermissionProfileListStore(
    (state) => state.commitSearch,
  );
  const setPage = usePermissionProfileListStore((state) => state.setPage);
  const setPerPage = usePermissionProfileListStore((state) => state.setPerPage);

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

  const query = usePermissionProfilesQuery(params);
  const result = query.data ?? EMPTY_RESULT;

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
    refresh: query.refetch,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}
