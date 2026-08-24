"use client";

import { useMemo, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { IconButton, Typography, toast } from "@citybox/mui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { SemanticBadge } from "@/components/ui/status/semantic-badge";
import { downloadFiscalDocument } from "@/lib/api/fiscal-client";
import {
  formatCurrencyBRLFromCents,
  formatIsoDateTimeBR,
  resolveFiscalDocumentStatusLabel,
  resolveFiscalDocumentStatusTone,
  FISCAL_DOCUMENT_TYPE_LABELS,
} from "@/features/facilita-nfe/lib/fiscal-document-format";
import type { FiscalDocumentListItem } from "@/features/facilita-nfe/types/fiscal-document";

/**
 * Ações de download da linha (spec erp/029, B3) — XML/PDF só existem para
 * documento AUTHORIZED; a fiscal-api devolve 404 pra qualquer outro status,
 * e isso é o comportamento correto (não há documento fiscal a baixar).
 */
function FacilitaNfeDownloadActions({ doc }: { doc: FiscalDocumentListItem }) {
  const [downloading, setDownloading] = useState<"xml" | "pdf" | null>(null);
  const authorized = doc.status === "AUTHORIZED";
  const disabledReason = authorized
    ? null
    : "Só é possível baixar XML/PDF de um documento autorizado pelo órgão.";
  const isNfse = doc.documentType === "NFSE";
  const pdfLabel = isNfse ? "Baixar DANFSE" : "Baixar DANFE";

  async function handleDownload(kind: "xml" | "pdf") {
    setDownloading(kind);
    try {
      const segment = doc.documentType === "NFSE" ? "nfse" : "nfe";
      const suffix = kind === "xml" ? "xml" : isNfse ? "danfse" : "danfe";
      const extension = kind === "xml" ? "xml" : "pdf";
      const filename = `${FISCAL_DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}-${doc.number ?? doc.id}.${extension}`;
      await downloadFiscalDocument(`/v1/${segment}/${doc.id}/${suffix}`, filename);
    } catch {
      toast.error(
        kind === "xml" ? "Não foi possível baixar o XML." : `Não foi possível baixar o ${isNfse ? "DANFSE" : "DANFE"}.`,
      );
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Tooltip title={disabledReason ?? ""} disableHoverListener={!disabledReason}>
      <span style={{ display: "inline-flex", gap: 4 }}>
        <IconButton
          size="small"
          aria-label="Baixar XML"
          disabled={!authorized || downloading !== null}
          onClick={() => void handleDownload("xml")}
        >
          {downloading === "xml" ? (
            <CircularProgress size={18} />
          ) : (
            <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
        <IconButton
          size="small"
          aria-label={pdfLabel}
          disabled={!authorized || downloading !== null}
          onClick={() => void handleDownload("pdf")}
        >
          {downloading === "pdf" ? (
            <CircularProgress size={18} />
          ) : (
            <PictureAsPdfOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}

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
      {
        id: "actions",
        header: "Ações",
        width: 100,
        render: (doc) => <FacilitaNfeDownloadActions doc={doc} />,
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
