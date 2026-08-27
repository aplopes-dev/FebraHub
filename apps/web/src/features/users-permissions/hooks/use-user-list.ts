"use client";

import { useEffect, useMemo } from "react";
import {
  DEFAULT_USER_PER_PAGE,
  useUserListStore,
} from "@/features/users-permissions/store/user-list.store";
import { useMembersQuery } from "@/features/users-permissions/hooks/use-member-queries";
import type { MemberListResult } from "@/features/users-permissions/types/user";

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_RESULT: MemberListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_USER_PER_PAGE, totalPages: 1 },
  tabCounts: { active: 0, deleted: 0 },
};

export function useUserList() {
  const tab = useUserListStore((state) => state.tab);
  const search = useUserListStore((state) => state.search);
  const debouncedSearch = useUserListStore((state) => state.debouncedSearch);
  const matrixId = useUserListStore((state) => state.matrixId);
  const branchId = useUserListStore((state) => state.branchId);
  const functionalRole = useUserListStore((state) => state.functionalRole);
  const page = useUserListStore((state) => state.page);
  const perPage = useUserListStore((state) => state.perPage);

  const setTab = useUserListStore((state) => state.setTab);
  const setSearch = useUserListStore((state) => state.setSearch);
  const commitSearch = useUserListStore((state) => state.commitSearch);
  const setMatrixId = useUserListStore((state) => state.setMatrixId);
  const setBranchId = useUserListStore((state) => state.setBranchId);
  const setFunctionalRole = useUserListStore((state) => state.setFunctionalRole);
  const setPage = useUserListStore((state) => state.setPage);
  const setPerPage = useUserListStore((state) => state.setPerPage);

  useEffect(() => {
    if (search === debouncedSearch) return;
    const timer = window.setTimeout(
      () => commitSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch, commitSearch]);

  const params = useMemo(
    () => ({
      tab,
      search: debouncedSearch,
      matrixId,
      branchId,
      functionalRole,
      page,
      perPage,
    }),
    [tab, debouncedSearch, matrixId, branchId, functionalRole, page, perPage],
  );

  const query = useMembersQuery(params);
  const result = query.data ?? EMPTY_RESULT;

  return {
    tab,
    setTab,
    search,
    setSearch,
    matrixId,
    setMatrixId,
    branchId,
    setBranchId,
    functionalRole,
    setFunctionalRole,
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
