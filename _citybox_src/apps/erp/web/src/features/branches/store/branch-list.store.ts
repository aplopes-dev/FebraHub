"use client";

import { create } from "zustand";

export const DEFAULT_PER_PAGE = 10;

type BranchListState = {
  search: string;
  debouncedSearch: string;
  page: number;
  perPage: number;
  /** Seleção em massa da página atual (ações em lote futuras). */
  selectedIds: string[];

  setSearch: (search: string) => void;
  commitSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  toggleSelected: (id: string) => void;
  setSelected: (ids: string[]) => void;
};

export const useBranchListStore = create<BranchListState>((set) => ({
  search: "",
  debouncedSearch: "",
  page: 1,
  perPage: DEFAULT_PER_PAGE,
  selectedIds: [],

  setSearch: (search) => set({ search }),
  commitSearch: (debouncedSearch) => set({ debouncedSearch, page: 1 }),
  setPage: (page) => set({ page }),
  setPerPage: (perPage) => set({ perPage, page: 1 }),
  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((selected) => selected !== id)
        : [...state.selectedIds, id],
    })),
  setSelected: (selectedIds) => set({ selectedIds }),
}));
