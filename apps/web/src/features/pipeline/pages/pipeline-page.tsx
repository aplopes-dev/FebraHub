"use client";

import { useState } from "react";
import { Box, PageHeader, Stack, Typography } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { Page } from "@/components/ui/page";
import { LostReasonDialog } from "@/features/pipeline/components/lost-reason-dialog";
import { PipelineKanban } from "@/features/pipeline/components/pipeline-kanban";
import { PipelineTable } from "@/features/pipeline/components/pipeline-table";
import { PipelineToolbar } from "@/features/pipeline/components/pipeline-toolbar";
import { usePipelineBoard } from "@/features/pipeline/hooks/use-pipeline-board";
import { useMoveStageMutation } from "@/features/pipeline/hooks/use-pipeline-mutations";
import type { OpportunityRow } from "@/features/pipeline/types/pipeline-view";
import { formatCentsCompact } from "@/lib/money";

type PendingLoss = {
  row: OpportunityRow;
  toStageId: string;
};

export function PipelinePage() {
  const {
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
    board,
    isLoading,
    isError,
    refetch,
  } = usePipelineBoard();

  const moveMutation = useMoveStageMutation();
  const [pendingLoss, setPendingLoss] = useState<PendingLoss | null>(null);

  function handleMove(row: OpportunityRow, toStageId: string, fromStageId: string) {
    if (toStageId === fromStageId) return true;

    const stage = board?.columns.find((column) => column.stage.id === toStageId)?.stage;
    if (!stage) return false;

    // Etapa de perda não aceita entrada sem justificativa: o card só vai depois
    // que o motivo for registrado.
    if (stage.requiresReason) {
      setPendingLoss({ row, toStageId });
      return false;
    }

    moveMutation.mutate({ opportunityId: row.id, stageId: toStageId });
    return true;
  }

  function confirmLoss(reasonId: string, note: string) {
    if (!pendingLoss) return;
    moveMutation.mutate({
      opportunityId: pendingLoss.row.id,
      stageId: pendingLoss.toStageId,
      lostReasonId: reasonId,
      lostReasonNote: note || undefined,
    });
    setPendingLoss(null);
  }

  const summary = board?.summary;

  return (
    <Page scroll={false}>
      <PageHeader
        title="Funil de vendas"
        description="Oportunidades por etapa. Arraste para mover; perder exige motivo."
        actions={
          summary ? (
            <Stack direction="row" spacing={3} sx={{ alignItems: "flex-end" }}>
              <Metric
                label="Em aberto"
                value={`${summary.openCount}`}
                hint={formatCentsCompact(summary.openTotalCents)}
              />
              <Metric
                label="Ganhas no recorte"
                value={`${summary.wonCount}`}
                hint={formatCentsCompact(summary.wonTotalCents)}
              />
              <Metric
                label="Perdidas"
                value={`${summary.lostCount}`}
                hint="no mesmo recorte"
              />
            </Stack>
          ) : null
        }
      />

      <ListPagePanel sx={{ gap: 2 }}>
        <PipelineToolbar
          view={view}
          onViewChange={setView}
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={patchFilters}
          onQuickChange={setQuick}
          options={options}
          summary={summary}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar o funil"
            onRetry={() => void refetch()}
          />
        ) : view === "kanban" ? (
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {board ? (
              <PipelineKanban board={board} onMove={handleMove} />
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Carregando o funil…
              </Typography>
            )}
          </Box>
        ) : (
          <PipelineTable rows={board?.rows ?? []} isLoading={isLoading} />
        )}
      </ListPagePanel>

      <LostReasonDialog
        key={pendingLoss?.row.id ?? "fechado"}
        open={Boolean(pendingLoss)}
        personName={pendingLoss?.row.personName}
        onCancel={() => setPendingLoss(null)}
        onConfirm={confirmLoss}
      />
    </Page>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Stack spacing={0}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        {hint}
      </Typography>
    </Stack>
  );
}
