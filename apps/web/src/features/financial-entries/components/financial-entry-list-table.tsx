"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { SemanticBadge } from "@/components/ui/status";
import { FinancialEntryOperationBadge } from "@/features/financial-entries/components/financial-entry-operation-badge";
import { FinancialEntryRowActions } from "@/features/financial-entries/components/financial-entry-row-actions";
import { FinancialEntryStatusBadge } from "@/features/financial-entries/components/financial-entry-status-badge";
import { computeEntryTotal } from "@/features/financial-entries/lib/financial-entry-form-values";
import {
  formatCurrencyBRL,
  formatIsoDateBR,
} from "@/features/financial-entries/lib/financial-entry-format";
import type {
  FinancialEntry,
  FinancialEntryListTab,
} from "@/features/financial-entries/types/financial-entry";

type FinancialEntryListTableProps = {
  entries: FinancialEntry[];
  tab: FinancialEntryListTab;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (entry: FinancialEntry) => void;
  onDelete: (entry: FinancialEntry) => void | Promise<void>;
  isDeleting?: boolean;
  onRestore: (entry: FinancialEntry) => void | Promise<void>;
  isRestoring?: boolean;
};

export function FinancialEntryListTable({
  entries,
  tab,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  isDeleting,
  onRestore,
  isRestoring,
}: FinancialEntryListTableProps) {
  const isDeletedTab = tab === "deleted";

  const columns = useMemo<DataTableColumn<FinancialEntry>[]>(
    () => [
      {
        id: "party",
        header: "Fornecedor ou cliente",
        render: (entry) => (
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                {entry.partyName || "—"}
              </Typography>
              {entry.cardSettlementFallback ? (
                <SemanticBadge label="Sem contrato aplicável" tone="warning" />
              ) : null}
            </Box>
            <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
              {entry.description}
            </Typography>
          </Box>
        ),
      },
      {
        id: "operation",
        header: "Tipo",
        width: 180,
        render: (entry) => (
          <FinancialEntryOperationBadge operation={entry.operation} />
        ),
      },
      {
        id: "category",
        header: "Categoria financeira",
        width: 240,
        render: (entry) => (
          <Typography variant="body2" noWrap>
            {entry.categoryLabel ?? "—"}
          </Typography>
        ),
      },
      {
        id: "dueDate",
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
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (entry) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <FinancialEntryRowActions
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={isDeleting}
              onRestore={isDeletedTab ? onRestore : undefined}
              isRestoring={isRestoring}
            />
          </Box>
        ),
      },
    ],
    [onEdit, onDelete, isDeleting, isDeletedTab, onRestore, isRestoring],
  );

  return (
    <DataTable
      columns={columns}
      rows={entries}
      getRowId={(entry) => entry.id}
      emptyMessage={
        isDeletedTab
          ? "Nenhum lançamento excluído."
          : "Nenhum lançamento encontrado."
      }
      onRowClick={isDeletedTab ? undefined : onEdit}
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
