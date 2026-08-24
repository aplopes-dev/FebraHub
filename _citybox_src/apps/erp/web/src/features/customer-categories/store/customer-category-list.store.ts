"use client";

import { create } from "zustand";
import type { CustomerCategoryListParams } from "@/features/customer-categories/types/customer-category";

export const DEFAULT_PER_PAGE = 10;

type CustomerCategoryListState = {
  search: string;
  debouncedSearch: string;
  page: number;
  perPage: number;

  setSearch: (search: string) => void;
  commitSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
};

export const useCustomerCategoryListStore = create<CustomerCategoryListState>(
  (set) => ({
    search: "",
    debouncedSearch: "",
    page: 1,
    perPage: DEFAULT_PER_PAGE,

    setSearch: (search) => set({ search }),
    commitSearch: (debouncedSearch) => set({ debouncedSearch, page: 1 }),
    setPage: (page) => set({ page }),
    setPerPage: (perPage) => set({ perPage, page: 1 }),
  }),
);

export function selectCustomerCategoryListParams(
  state: CustomerCategoryListState,
): CustomerCategoryListParams {
  return {
    search: state.debouncedSearch,
    page: state.page,
    perPage: state.perPage,
  };
}
