"use client";

import { Badge, PageHeader, Stack, Typography } from "@/ui";
import { DataTable, ListPagePanel, type DataTableColumn } from "@/components/ui/data-table";
import { Page } from "@/components/ui/page";
import { useEditionsQuery } from "@/features/event-editions/hooks/use-edition-queries";
import type { EditionRow } from "@/features/event-editions/types/edition-view";
import { formatIsoDate } from "@/lib/date";
import { formatCents } from "@/lib/money";

const STATUS_LABEL: Record<string, string> = {
  planejada: "Planejada",
  vendas_abertas: "Vendas abertas",
  em_andamento: "Acontecendo",
  encerrada: "Encerrada",
};

/**
 * As edições — o produto datado.
 *
 * A lista mostra ocupação e receita de ingresso lado a lado com as matrículas
 * geradas, porque são coisas diferentes: encher a sala e vender curso na sala
 * são dois resultados, e um evento pode acertar um e falhar no outro.
 */
export function EditionListPage() {
  const query = useEditionsQuery();

  const columns: DataTableColumn<EditionRow>[] = [
    {
      id: "edition",
      header: "Edição",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.edition.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {row.edition.venue} · {row.edition.instructor}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "when",
      header: "Quando",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{formatIsoDate(row.edition.startsAt)}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {row.edition.city}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "status",
      header: "Situação",
      render: (row) => (
        <Badge
          label={STATUS_LABEL[row.edition.status] ?? row.edition.status}
          size="small"
          variant="outlined"
          sx={
            row.edition.status === "em_andamento"
              ? { borderColor: "primary.main", color: "primary.main", fontWeight: 700 }
              : undefined
          }
        />
      ),
    },
    {
      id: "tickets",
      header: "Ingressos",
      align: "right",
      render: (row) => (
        <Stack spacing={0.25} sx={{ alignItems: "flex-end" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.sold} / {row.capacity}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {row.occupancyPercent}% da casa
          </Typography>
        </Stack>
      ),
    },
    {
      id: "revenue",
      header: "Receita de ingresso",
      align: "right",
      render: (row) => (
        <Typography variant="body2">{formatCents(row.ticketRevenueCents)}</Typography>
      ),
    },
    {
      id: "enrollments",
      header: "Matrículas na sala",
      align: "right",
      render: (row) =>
        row.hasRoom ? (
          <Typography variant="body2" sx={{ fontWeight: 600, color: "success.dark" }}>
            {row.enrollments}
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            sala não aberta
          </Typography>
        ),
    },
  ];

  return (
    <Page scroll={false}>
      <PageHeader
        title="Eventos e ingressos"
        description="Cada edição é um produto datado: instrutor, praça e lote mudam o resultado."
      />
      <ListPagePanel>
        <DataTable
          columns={columns}
          rows={query.data ?? []}
          getRowId={(row) => row.edition.id}
          isLoading={query.isPending}
          getRowHref={(row) => `/comercial/eventos/${row.edition.id}`}
          emptyMessage="Nenhuma edição cadastrada."
          pageScroll
        />
      </ListPagePanel>
    </Page>
  );
}
