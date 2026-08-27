"use client";

import { create } from "zustand";
import { createEmptyProductFilters } from "@/features/products/lib/product-filters";
import type {
  ProductListFilters,
  ProductListTab,
  ProductSortOption,
} from "@/features/products/types/product";

export const DEFAULT_PER_PAGE = 10;

/**
 * Estado de **UI** da listagem de produtos.
 *
 * Só entra aqui o que o usuário controla na tela (aba, busca, filtros,
 * ordenação, página, seleção). Os **dados** vêm do React Query — nunca
 * duplicar produtos/meta/tabCounts neste store (regra de
 * `rules/ecc/react/patterns.md`: server state fica na lib de server state).
 */
type ProductListState = {
  tab: ProductListTab;
  search: string;
  /** Valor com debounce — é ele que vai para a query. */
  debouncedSearch: string;
  filters: ProductListFilters;
  sort: ProductSortOption;
  page: number;
  perPage: number;
  selectedIds: Set<string>;

  setTab: (tab: ProductListTab) => void;
  setSearch: (search: string) => void;
  commitSearch: (search: string) => void;
  setFilters: (filters: ProductListFilters) => void;
  setSort: (sort: ProductSortOption) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  toggleSelectOne: (id: string) => void;
  setPageSelection: (ids: string[], selected: boolean) => void;
  clearSelection: () => void;
};

/** Mudar de recorte invalida página e seleção — senão sobra seleção fantasma. */
const RESET = { page: 1, selectedIds: new Set<string>() };

export const useProductListStore = create<ProductListState>((set) => ({
  tab: "all",
  search: "",
  debouncedSearch: "",
  filters: createEmptyProductFilters(),
  sort: "name_asc",
  page: 1,
  perPage: DEFAULT_PER_PAGE,
  selectedIds: new Set<string>(),

  setTab: (tab) => set({ tab, ...RESET, selectedIds: new Set() }),
  setSearch: (search) => set({ search }),
  commitSearch: (debouncedSearch) =>
    set({ debouncedSearch, page: 1, selectedIds: new Set() }),
  setFilters: (filters) => set({ filters, page: 1, selectedIds: new Set() }),
  setSort: (sort) => set({ sort, page: 1, selectedIds: new Set() }),
  setPage: (page) => set({ page, selectedIds: new Set() }),
  setPerPage: (perPage) =>
    set({ perPage, page: 1, selectedIds: new Set() }),

  toggleSelectOne: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  setPageSelection: (ids, selected) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      for (const id of ids) {
        if (selected) next.add(id);
        else next.delete(id);
      }
      return { selectedIds: next };
    }),

  clearSelection: () => set({ selectedIds: new Set() }),
}));
