"use client";

import { create } from "zustand";
import type {
  CustomerListParams,
  CustomerListTab,
} from "@/features/customers/types/customer";

export const DEFAULT_PER_PAGE = 10;

type CustomerListState = {
  tab: CustomerListTab;
  search: string;
  debouncedSearch: string;
  page: number;
  perPage: number;
  selectedIds: string[];

  setTab: (tab: CustomerListTab) => void;
  setSearch: (search: string) => void;
  commitSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
};

export const useCustomerListStore = create<CustomerListState>((set) => ({
  tab: "all",
  search: "",
  debouncedSearch: "",
  page: 1,
  perPage: DEFAULT_PER_PAGE,
  selectedIds: [],

  setTab: (tab) => set({ tab, page: 1, selectedIds: [] }),
  setSearch: (search) => set({ search }),
  commitSearch: (debouncedSearch) =>
    set({ debouncedSearch, page: 1, selectedIds: [] }),
  setPage: (page) => set({ page, selectedIds: [] }),
  setPerPage: (perPage) => set({ perPage, page: 1, selectedIds: [] }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  clearSelection: () => set({ selectedIds: [] }),
}));

export function selectCustomerListParams(
  state: CustomerListState,
): CustomerListParams {
  return {
    tab: state.tab,
    search: state.debouncedSearch,
    page: state.page,
    perPage: state.perPage,
  };
}
