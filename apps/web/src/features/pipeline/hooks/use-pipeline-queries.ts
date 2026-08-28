"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getOpportunityDetail,
  getPipelineBoard,
} from "@/features/pipeline/services/pipeline.service";
import { pipelineKeys } from "@/features/pipeline/hooks/query-keys";
import type { PipelineFilters } from "@/features/pipeline/types/pipeline-view";
import { useCatalogScope } from "@/lib/organization-context";

export function usePipelineBoardQuery(filters: PipelineFilters) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: pipelineKeys.board(scope, filters),
    queryFn: async () => getPipelineBoard(filters),
    enabled: ready,
  });
}

export function useOpportunityDetailQuery(id: string | undefined) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: pipelineKeys.detail(scope, id ?? ""),
    queryFn: async () => getOpportunityDetail(id!) ?? null,
    enabled: ready && Boolean(id),
  });
}
