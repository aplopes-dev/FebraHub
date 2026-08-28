"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { FUNNELS } from "@/lib/mock-db";
import {
  persistPipelineView,
  readDefaultPipelineView,
  readStoredPipelineView,
  subscribePipelineView,
} from "@/features/pipeline/lib/pipeline-view-storage";
import { usePipelineBoardQuery } from "@/features/pipeline/hooks/use-pipeline-queries";
import { getPipelineOptions } from "@/features/pipeline/services/pipeline.service";
import type {
  PipelineFilters,
  PipelineQuickFilter,
  PipelineView,
} from "@/features/pipeline/types/pipeline-view";

const SEARCH_DEBOUNCE_MS = 300;

function createDefaultFilters(): PipelineFilters {
  return {
    funnelId: FUNNELS[0]?.id ?? "",
    ownerId: "todos",
    productId: "todos",
    channel: "todos",
    quick: "todas",
    search: "",
  };
}

/** Estado da tela do funil: visão, filtros, busca com debounce e dados. */
export function usePipelineBoard() {
  // Store externo (localStorage + evento): o servidor renderiza o padrão e o
  // cliente assume a preferência sem um segundo render com estado diferente.
  const view = useSyncExternalStore(
    subscribePipelineView,
    readStoredPipelineView,
    readDefaultPipelineView,
  );
  const [filters, setFilters] = useState<PipelineFilters>(createDefaultFilters);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) =>
        current.search === search ? current : { ...current, search },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = usePipelineBoardQuery(filters);
  const options = useMemo(() => getPipelineOptions(), []);

  function setView(next: PipelineView) {
    persistPipelineView(next);
  }

  function patchFilters(patch: Partial<PipelineFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function setQuick(quick: PipelineQuickFilter) {
    patchFilters({ quick: filters.quick === quick ? "todas" : quick });
  }

  const hasActiveFilters =
    filters.ownerId !== "todos" ||
    filters.productId !== "todos" ||
    filters.channel !== "todos" ||
    filters.quick !== "todas" ||
    filters.search.trim().length > 0;

  function clearFilters() {
    setSearch("");
    setFilters((current) => ({ ...createDefaultFilters(), funnelId: current.funnelId }));
  }

  return {
    view,
    setView,
    filters,
    patchFilters,
    setQuick,
    search,
    setSearch,
    clearFilters,
    hasActiveFilters,
    options,
    board: query.data,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
