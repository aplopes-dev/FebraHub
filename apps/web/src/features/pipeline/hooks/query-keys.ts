import type { PipelineFilters } from "@/features/pipeline/types/pipeline-view";

export const pipelineKeys = {
  all: (scope: string) => ["pipeline", scope] as const,
  board: (scope: string, filters: PipelineFilters) =>
    ["pipeline", scope, "board", filters] as const,
  detail: (scope: string, id: string) => ["pipeline", scope, "detail", id] as const,
};
