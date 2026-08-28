"use client";

import { Avatar, Badge, Box, Stack, Tooltip, Typography } from "@/ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { OriginChip } from "@/features/pipeline/components/origin-chip";
import type { OpportunityRow } from "@/features/pipeline/types/pipeline-view";
import { formatCents, formatPercent } from "@/lib/money";
import { formatIsoDate } from "@/lib/date";

/**
 * A mesma verdade do quadro, em lista.
 *
 * A lista existe para o que o quadro não faz bem: comparar valor, desconto e
 * tempo parado entre dezenas de oportunidades de uma vez.
 */
export function PipelineTable({
  rows,
  isLoading,
}: {
  rows: OpportunityRow[];
  isLoading: boolean;
}) {
  const columns: DataTableColumn<OpportunityRow>[] = [
    {
      id: "person",
      header: "Pessoa",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.personName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {row.personCity}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "product",
      header: "Produto",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{row.productShortName}</Typography>
          {row.editionName ? (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {row.editionName}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              Turma a definir
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      id: "stage",
      header: "Etapa",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{row.stageName}</Typography>
          <Typography
            variant="caption"
            sx={{ color: row.stalled ? "error.main" : "text.secondary" }}
          >
            {row.daysInStage} d
          </Typography>
        </Stack>
      ),
    },
    {
      id: "amount",
      header: "Valor praticado",
      align: "right",
      render: (row) => (
        <Stack spacing={0.25} sx={{ alignItems: "flex-end" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatCents(row.amountCents)}
          </Typography>
          {row.discountPercent > 0 ? (
            <Tooltip title={`Tabela ${formatCents(row.listPriceCents)}`} arrow>
              <Typography variant="caption" sx={{ color: "warning.dark" }}>
                −{formatPercent(row.discountPercent)} da tabela
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              Sem desconto
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      id: "next",
      header: "Próxima ação",
      render: (row) =>
        row.status !== "aberta" ? (
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Encerrada
          </Typography>
        ) : row.nextAction ? (
          <Stack spacing={0.25}>
            <Typography variant="body2">{row.nextAction.title}</Typography>
            <Typography
              variant="caption"
              sx={{
                color: row.nextAction.overdue ? "error.main" : "text.secondary",
                fontWeight: row.nextAction.overdue ? 600 : 400,
              }}
            >
              {row.nextAction.overdue ? "Vencida em " : "Vence em "}
              {formatIsoDate(row.nextAction.dueAt)}
            </Typography>
          </Stack>
        ) : (
          <Badge
            label="Sem próxima ação"
            variant="outlined"
            size="small"
            sx={{ borderColor: "warning.main", color: "warning.dark" }}
          />
        ),
    },
    {
      id: "origin",
      header: "Origem",
      render: (row) => <OriginChip origin={row.origin} />,
    },
    {
      id: "owner",
      header: "Responsável",
      render: (row) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Avatar sx={{ width: 26, height: 26, fontSize: "0.6875rem" }}>
            {row.ownerInitials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {row.ownerName}
            </Typography>
          </Box>
        </Stack>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      getRowHref={(row) => `/comercial/oportunidades/${row.id}`}
      emptyMessage="Nenhuma oportunidade neste recorte."
      pageScroll
    />
  );
}
