"use client";

import { create } from "zustand";
import type {
  CarrierListParams,
  CarrierListTab,
} from "@/features/carriers/types/carrier";

export const DEFAULT_PER_PAGE = 10;

type CarrierListState = {
  tab: CarrierListTab;
  search: string;
  debouncedSearch: string;
  page: number;
  perPage: number;

  setTab: (tab: CarrierListTab) => void;
  setSearch: (search: string) => void;
  commitSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
};

export const useCarrierListStore = create<CarrierListState>((set) => ({
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

export function selectCarrierListParams(
  state: CarrierListState,
): CarrierListParams {
  return {
    tab: state.tab,
    search: state.debouncedSearch,
    page: state.page,
    perPage: state.perPage,
  };
}
