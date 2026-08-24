import type { FiscalDocumentStatus } from "@/features/facilita-nfe/types/fiscal-document";

export function formatCurrencyBRLFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatIsoDateTimeBR(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

const STATUS_LABELS: Record<FiscalDocumentStatus, string> = {
  DRAFT: "Rascunho",
  VALIDATING: "Validando",
  NUMBER_RESERVED: "Número reservado",
  XML_GENERATED: "XML gerado",
  SIGNED: "Assinado",
  SENT: "Enviado",
  PROCESSING: "Processando",
  AUTHORIZED: "Autorizada",
  REJECTED: "Rejeitada",
  DENIED: "Denegada",
  CANCEL_REQUESTED: "Cancelamento solicitado",
  CANCEL_AUTHORIZED: "Cancelada",
  CANCEL_REJECTED: "Cancelamento rejeitado",
  CORRECTION_LETTER_AUTHORIZED: "Carta de correção autorizada",
  INUTILIZED: "Inutilizada",
  ERROR: "Erro",
  SYNC_REQUIRED: "Sincronização pendente",
};

/** Fallback defensivo — status fora do enum conhecido não quebra a linha (Edge Case da spec). */
export function resolveFiscalDocumentStatusLabel(
  status: string,
): string {
  return STATUS_LABELS[status as FiscalDocumentStatus] ?? status;
}

export type FiscalDocumentStatusTone = "success" | "error" | "warning" | "neutral";

const STATUS_TONES: Record<FiscalDocumentStatus, FiscalDocumentStatusTone> = {
  DRAFT: "neutral",
  VALIDATING: "neutral",
  NUMBER_RESERVED: "neutral",
  XML_GENERATED: "neutral",
  SIGNED: "neutral",
  SENT: "warning",
  PROCESSING: "warning",
  AUTHORIZED: "success",
  REJECTED: "error",
  DENIED: "error",
  CANCEL_REQUESTED: "warning",
  CANCEL_AUTHORIZED: "error",
  CANCEL_REJECTED: "warning",
  CORRECTION_LETTER_AUTHORIZED: "success",
  INUTILIZED: "neutral",
  ERROR: "error",
  SYNC_REQUIRED: "warning",
};

export function resolveFiscalDocumentStatusTone(
  status: string,
): FiscalDocumentStatusTone {
  return STATUS_TONES[status as FiscalDocumentStatus] ?? "neutral";
}

export const FISCAL_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  NFE: "NF-e",
  NFSE: "NFS-e",
  NFCE: "NFC-e",
};
