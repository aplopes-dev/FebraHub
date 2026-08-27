"use client";

import { useCallback, useEffect, useState } from "react";
import { useProductionOrdersQuery } from "@/features/production/hooks/use-production-orders-query";
import {
  readStoredProductionView,
  writeStoredProductionView,
  type ProductionView,
} from "@/features/production/lib/production-view-storage";
import type {
  ProductionOrder,
  ProductionOrderListResult,
  ProductionStatusTab,
} from "@/features/production/types/production";

export type { ProductionView };
export type { ProductionStatusTab };

const SEARCH_DEBOUNCE_MS = 400;
const KANBAN_PER_PAGE = 100;
const DEFAULT_LIST_PER_PAGE = 10;

const EMPTY_RESULT: ProductionOrderListResult = {
  data: [],
  meta: { total: 0, page: 1, perPage: DEFAULT_LIST_PER_PAGE, totalPages: 1 },
  tabCounts: { all: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 },
};

type UseProductionBoardOptions = {
  initialCreateOpen?: boolean;
};

/**
 * Estado central da tela única de Produção: busca (com debounce 400ms),
 * alternância Kanban/Lista (persistida em localStorage), filtro de status na
 * Lista, e os dois drawers (detalhe/criação). O Kanban busca todos os status
 * de uma vez (para montar as colunas); a Lista busca paginada, filtrada pela
 * aba de status ativa.
 */
export function useProductionBoard({
  initialCreateOpen = false,
}: UseProductionBoardOptions = {}) {
  const [view, setViewState] = useState<ProductionView>(readStoredProductionView);
  const [statusTab, setStatusTabState] = useState<ProductionStatusTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_LIST_PER_PAGE);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(initialCreateOpen);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const setView = useCallback((next: ProductionView) => {
    setViewState(next);
    writeStoredProductionView(next);
  }, []);

  function setStatusTab(next: ProductionStatusTab) {
    setStatusTabState(next);
    setPage(1);
  }

  const kanbanQuery = useProductionOrdersQuery({
    tab: "all",
    search: debouncedSearch,
    page: 1,
    perPage: KANBAN_PER_PAGE,
  });

  const listQuery = useProductionOrdersQuery({
    tab: statusTab,
    search: debouncedSearch,
    page,
    perPage,
  });

  const kanbanResult = kanbanQuery.data ?? EMPTY_RESULT;
  const listResult = listQuery.data ?? EMPTY_RESULT;

  return {
    view,
    setView,
    statusTab,
    setStatusTab,
    search,
    setSearch,
    page,
    setPage,
    perPage,
    setPerPage: (next: number) => {
      setPerPage(next);
      setPage(1);
    },
    /** Todos os status, respeitando a busca — usado pelo Kanban (colunas = status). */
    kanbanOrders: kanbanResult.data,
    kanbanUpdatedAt: kanbanQuery.dataUpdatedAt,
    /** Busca + filtro de status da aba selecionada, paginado — usado pela Lista. */
    listOrders: listResult.data,
    listMeta: listResult.meta,
    tabCounts: listResult.tabCounts,
    // `isLoading` puro, não `|| isFetching`: incluir o refetch trocava o
    // board inteiro pelo skeleton a cada Iniciar/Finalizar/Cancelar, com
    // flash duplo por causa do `key` de remontagem. Mesmo fix já aplicado em
    // Produtos (2026-08-16).
    isKanbanLoading: kanbanQuery.isLoading,
    isListLoading: listQuery.isLoading,
    isError: kanbanQuery.isError || listQuery.isError,
    refresh: () => {
      void kanbanQuery.refetch();
      void listQuery.refetch();
    },
    selectedOrder,
    setSelectedOrder,
    createOpen,
    setCreateOpen,
  };
}
