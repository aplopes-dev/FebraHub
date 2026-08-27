"use client";

import Stack from "@mui/material/Stack";
import { SearchInput } from "@/ui";
import { Button } from "@/ui";
import FilterList from "@mui/icons-material/FilterList";
import { DataTable, ListPagePanel, type DataTableColumn } from "@/components/ui/data-table";
import { FacilitaNfeSummaryCards } from "@/features/facilita-nfe/components/facilita-nfe-summary-cards";

type FacilitaNfePlaceholderTabProps = {
  /** Cabeçalhos de coluna do mockup — só a linha de cabeçalho, sem dado real (FR-006/FR-008). */
  columns: string[];
};

/**
 * Aba "Recebido" ou "Histórico de Envios" — fora de escopo nesta entrega
 * (`spec.md` `## Clarifications`, sessão 2026-08-09). Mostra os mesmos cards
 * de totais zerados, busca/filtro desabilitados e "Sem dados no momento",
 * sem nenhuma chamada de rede.
 */
export function FacilitaNfePlaceholderTab({ columns }: FacilitaNfePlaceholderTabProps) {
  const tableColumns: DataTableColumn<never>[] = columns.map((label, index) => ({
    id: `col-${index}`,
    header: label,
    render: () => null,
  }));

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{ alignItems: { lg: "flex-start" }, justifyContent: "space-between" }}
      >
        <div />
        <FacilitaNfeSummaryCards summary={{ total: 0, authorized: 0, cancelled: 0 }} />
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <SearchInput
          size="small"
          value=""
          disabled
          placeholder="Buscar por"
          aria-label="Busca indisponível — sem dados nesta entrega"
          sx={{ width: "100%", maxWidth: 360 }}
        />
        <Button
          type="button"
          variant="outlined"
          startIcon={<FilterList sx={{ fontSize: 16 }} />}
          disabled
          sx={{ flexShrink: 0 }}
        >
          Filtro
        </Button>
      </Stack>

      <ListPagePanel>
        <DataTable
          columns={tableColumns}
          rows={[]}
          getRowId={() => ""}
          emptyMessage="Sem dados no momento"
        />
      </ListPagePanel>
    </Stack>
  );
}
