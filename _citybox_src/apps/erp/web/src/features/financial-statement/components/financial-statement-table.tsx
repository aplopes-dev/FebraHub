"use client";

import { useMemo } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import { Checkbox, Typography } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { FinancialEntryStatusBadge } from "@/features/financial-entries/components/financial-entry-status-badge";
import { computeEntryTotal } from "@/features/financial-entries/lib/financial-entry-form-values";
import {
  formatCurrencyBRL,
  formatIsoDateBR,
  resolvePaymentMethodLabel,
} from "@/features/financial-entries/lib/financial-entry-format";
import type { FinancialEntry } from "@/features/financial-entries/types/financial-entry";

type FinancialStatementTableProps = {
  entries: FinancialEntry[];
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Seleção de linhas com soma (US3) — `undefined` desliga a coluna de checkbox. */
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
};

/**
 * Lista somente-leitura do extrato (FR-003) — Competência, Vencimento,
 * Categoria, Método de pagamento, Valor original, Valor final e Status,
 * nessa ordem (as duas colunas de data ficam sempre visíveis, sem alternar
 * por filtro — `007-financeiro-ajustes-ui`). A última coluna só navega até
 * o lançamento em `/financas/lancamentos/[id]`, sem nenhuma ação de escrita
 * nesta tela.
 */
export function FinancialStatementTable({
  entries,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  onToggleSelect,
}: FinancialStatementTableProps) {
  const columns = useMemo<DataTableColumn<FinancialEntry>[]>(
    () => [
      ...(selectedIds && onToggleSelect
        ? [
            {
              id: "select",
              header: "",
              width: 40,
              render: (entry: FinancialEntry) => (
                <Box
                  onClick={(event: MouseEvent) => event.stopPropagation()}
                  onKeyDown={(event: KeyboardEvent) => event.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedIds.has(entry.id)}
                    onChange={() => onToggleSelect(entry.id)}
                    aria-label={`Selecionar lançamento ${entry.description}`}
                  />
                </Box>
              ),
            } satisfies DataTableColumn<FinancialEntry>,
          ]
        : []),
      {
        id: "competence",
        header: "Competência",
        width: 120,
        render: (entry) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary" }}
          >
            {formatIsoDateBR(entry.competenceDate)}
          </Typography>
        ),
      },
      {
        id: "due",
        header: "Vencimento",
        width: 120,
        render: (entry) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary" }}
          >
            {formatIsoDateBR(entry.dueDate)}
          </Typography>
        ),
      },
      {
        id: "category",
        header: "Categoria",
        width: 200,
        render: (entry) => (
          <Typography variant="body2" noWrap>
            {entry.categoryLabel ?? "—"}
          </Typography>
        ),
      },
      {
        id: "paymentMethod",
        header: "Método de pagamento",
        width: 180,
        render: (entry) => (
          <Typography variant="body2" noWrap>
            {resolvePaymentMethodLabel(entry.payments)}
          </Typography>
        ),
      },
      {
        id: "originalAmount",
        header: "Valor original",
        width: 130,
        render: (entry) => (
          <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {formatCurrencyBRL(entry.baseAmount)}
          </Typography>
        ),
      },
      {
        id: "finalAmount",
        header: "Valor final",
        width: 130,
        render: (entry) => (
          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {formatCurrencyBRL(computeEntryTotal(entry))}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        width: 130,
        render: (entry) => (
          <FinancialEntryStatusBadge
            operation={entry.operation}
            status={entry.status}
          />
        ),
      },
      {
        id: "link",
        header: "",
        width: 56,
        align: "right",
        render: (entry) => (
          <Box onClick={(event) => event.stopPropagation()}>
            <MuiLink
              component={NextLink}
              href={`/financas/lancamentos/${entry.id}`}
              underline="hover"
              sx={{ typography: "body2", fontWeight: 500, whiteSpace: "nowrap" }}
            >
              Ver
            </MuiLink>
          </Box>
        ),
      },
    ],
    [selectedIds, onToggleSelect],
  );

  return (
    <DataTable
      columns={columns}
      rows={entries}
      getRowId={(entry) => entry.id}
      emptyMessage="Nenhuma movimentação encontrada."
      pagination={{
        page,
        perPage: pageSize,
        total,
        onPageChange,
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
