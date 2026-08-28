"use client";

import { useMemo, useState } from "react";
import { Box, Paper, Stack, Typography } from "@/ui";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanItem,
} from "@/components/ui/kanban";
import { OpportunityCard } from "@/features/pipeline/components/opportunity-card";
import type { PipelineBoard } from "@/features/pipeline/types/pipeline-view";
import type { OpportunityRow } from "@/features/pipeline/types/pipeline-view";
import { formatCentsCompact } from "@/lib/money";

type CardItem = KanbanItem & { row: OpportunityRow };

export type PipelineKanbanProps = {
  board: PipelineBoard;
  /** Devolve `false` para desfazer o movimento (ex.: motivo obrigatório). */
  onMove: (row: OpportunityRow, toStageId: string, fromStageId: string) => boolean;
};

/**
 * O quadro do funil.
 *
 * Cada coluna é uma etapa configurada, com contagem e soma no cabeçalho —
 * o gestor precisa ver **quanto** tem parado em cada etapa, não só quantos.
 */
export function PipelineKanban({ board, onMove }: PipelineKanbanProps) {
  const columns = useMemo(
    () => board.columns.map((column) => ({ id: column.stage.id, name: column.stage.name })),
    [board.columns],
  );

  const initial = useMemo<CardItem[]>(
    () =>
      board.columns.flatMap((column) =>
        column.rows.map((row) => ({ id: row.id, column: column.stage.id, row })),
      ),
    [board.columns],
  );

  const [data, setData] = useState<CardItem[]>(initial);
  const [lastInitial, setLastInitial] = useState(initial);

  // O board é fonte da verdade: qualquer refetch (mover card, salvar proposta)
  // reposiciona os cards a partir dele. O ajuste acontece **durante o render**
  // — em efeito, seria um segundo render com o card na coluna antiga.
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setData(initial);
  }

  function handleColumnChange(cardId: string, toColumn: string, fromColumn: string) {
    const item = data.find((entry) => entry.id === cardId);
    if (!item) return;

    const accepted = onMove(item.row, toColumn, fromColumn);
    if (!accepted) {
      // Devolve o card para a coluna de origem até a confirmação acontecer.
      setData((current) =>
        current.map((entry) =>
          entry.id === cardId ? { ...entry, column: fromColumn } : entry,
        ),
      );
    }
  }

  const totalsByStage = new Map(
    board.columns.map((column) => [
      column.stage.id,
      { count: column.rows.length, totalCents: column.totalCents },
    ]),
  );

  return (
    <KanbanProvider<CardItem>
      columns={columns}
      data={data}
      onDataChange={setData}
      onColumnChange={handleColumnChange}
      renderOverlay={(item) => (
        <Paper variant="outlined" sx={{ p: 1.5, width: 300, borderRadius: 2 }}>
          <OpportunityCard row={item.row} />
        </Paper>
      )}
    >
      {(column) => {
        const totals = totalsByStage.get(column.id);
        return (
          <KanbanBoard key={column.id} id={column.id} sx={{ width: 296, flexShrink: 0 }}>
            <KanbanHeader>
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {column.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {formatCentsCompact(totals?.totalCents ?? 0)}
                </Typography>
              </Stack>
              <Box
                sx={{
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "text.secondary",
                }}
              >
                {totals?.count ?? 0}
              </Box>
            </KanbanHeader>

            <KanbanCards<CardItem>
              id={column.id}
              emptyState={
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.disabled",
                    px: 1.5,
                    py: 4,
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  Nada nesta etapa.
                </Typography>
              }
            >
              {(item) => (
                <KanbanCard key={item.id} id={item.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      borderColor: item.row.stalled ? "error.light" : "divider",
                      "&:hover": { borderColor: "primary.main" },
                    }}
                  >
                    <OpportunityCard row={item.row} />
                  </Paper>
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        );
      }}
    </KanbanProvider>
  );
}
