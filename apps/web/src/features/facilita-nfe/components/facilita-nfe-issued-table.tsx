"use client";

import { useMemo } from "react";
import { Typography } from "@/ui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { SemanticBadge } from "@/components/ui/status/semantic-badge";
import {
  formatCurrencyBRLFromCents,
  formatIsoDateTimeBR,
  resolveFiscalDocumentStatusLabel,
  resolveFiscalDocumentStatusTone,
  FISCAL_DOCUMENT_TYPE_LABELS,
} from "@/features/facilita-nfe/lib/fiscal-document-format";
import type { FiscalDocumentListItem } from "@/features/facilita-nfe/types/fiscal-document";

type FacilitaNfeIssuedTableProps = {
  documents: FiscalDocumentListItem[];
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

/** Tabela da aba "Emitido" — FR-004: Data de emissão, Status, Cliente, Valor, Número, Série, Modelo. */
export function FacilitaNfeIssuedTable({
  documents,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: FacilitaNfeIssuedTableProps) {
  const columns = useMemo<DataTableColumn<FiscalDocumentListItem>[]>(
    () => [
      {
        id: "issuedAt",
        header: "Data de emissão",
        width: 130,
        render: (doc) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary" }}
          >
            {formatIsoDateTimeBR(doc.issuedAt)}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        width: 160,
        render: (doc) => (
          <SemanticBadge
            label={resolveFiscalDocumentStatusLabel(doc.status)}
            tone={resolveFiscalDocumentStatusTone(doc.status)}
          />
        ),
      },
      {
        id: "customer",
        header: "Cliente",
        width: 220,
        render: (doc) => (
          <Typography variant="body2" noWrap>
            {doc.customerName ?? "Consumidor não identificado"}
          </Typography>
        ),
      },
      {
        id: "totalAmount",
        header: "Valor",
        width: 130,
        render: (doc) => (
          <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {formatCurrencyBRLFromCents(doc.totalAmountCents)}
          </Typography>
        ),
      },
      {
        id: "number",
        header: "Número",
        width: 100,
        render: (doc) => (
          <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {doc.number ?? "—"}
          </Typography>
        ),
      },
      {
        id: "series",
        header: "Série",
        width: 90,
        render: (doc) => <Typography variant="body2">{doc.series ?? "—"}</Typography>,
      },
      {
        id: "documentType",
        header: "Modelo",
        width: 100,
        render: (doc) => (
          <Typography variant="body2">
            {FISCAL_DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
          </Typography>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      rows={documents}
      getRowId={(doc) => doc.id}
      emptyMessage="Sem dados no momento"
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
