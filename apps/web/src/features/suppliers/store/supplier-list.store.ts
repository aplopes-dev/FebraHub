"use client";

import { create } from "zustand";
import type {
  SupplierListParams,
  SupplierListTab,
} from "@/features/suppliers/types/supplier";

export const DEFAULT_PER_PAGE = 10;

type SupplierListState = {
  tab: SupplierListTab;
  search: string;
  debouncedSearch: string;
  page: number;
  perPage: number;

  setTab: (tab: SupplierListTab) => void;
  setSearch: (search: string) => void;
  commitSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
};

export const useSupplierListStore = create<SupplierListState>((set) => ({
  tab: "active",
  search: "",
  debouncedSearch: "",
  page: 1,
  perPage: DEFAULT_PER_PAGE,

  setTab: (tab) => set({ tab, page: 1 }),
  setSearch: (search) => set({ search }),
  commitSearch: (debouncedSearch) => set({ debouncedSearch, page: 1 }),
  setPage: (page) => set({ page }),
  setPerPage: (perPage) => set({ perPage, page: 1 }),
}));

export function selectSupplierListParams(
  state: SupplierListState,
): SupplierListParams {
  return {
    tab: state.tab,
    search: state.debouncedSearch,
    page: state.page,
    perPage: state.perPage,
  };
}
