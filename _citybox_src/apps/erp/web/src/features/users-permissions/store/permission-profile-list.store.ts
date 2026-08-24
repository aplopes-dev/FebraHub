"use client";

import { create } from "zustand";
import type {
  PermissionProfileListParams,
  PermissionProfileListTab,
} from "@/features/users-permissions/types/permission-profile";

export const DEFAULT_PROFILE_PER_PAGE = 20;

type PermissionProfileListState = {
  tab: PermissionProfileListTab;
  search: string;
  debouncedSearch: string;
  page: number;
  perPage: number;

  setTab: (tab: PermissionProfileListTab) => void;
  setSearch: (search: string) => void;
  commitSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
};

export const usePermissionProfileListStore = create<PermissionProfileListState>(
  (set) => ({
    tab: "active",
    search: "",
    debouncedSearch: "",
    page: 1,
    perPage: DEFAULT_PROFILE_PER_PAGE,

    setTab: (tab) => set({ tab, page: 1 }),
    setSearch: (search) => set({ search }),
    commitSearch: (debouncedSearch) => set({ debouncedSearch, page: 1 }),
    setPage: (page) => set({ page }),
    setPerPage: (perPage) => set({ perPage, page: 1 }),
  }),
);

export function selectPermissionProfileListParams(
  state: PermissionProfileListState,
): PermissionProfileListParams {
  return {
    tab: state.tab,
    search: state.debouncedSearch,
    page: state.page,
    perPage: state.perPage,
  };
}
