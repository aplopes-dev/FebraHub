"use client";

import { SemanticBadge } from "@/components/ui/status";
import type { SemanticTone } from "@/components/ui/status/semantic-badge";
import type { CertificateStatus } from "../types/certificate";

const STATUS_META: Record<CertificateStatus, { label: string; tone: SemanticTone }> = {
  VALID: { label: "Válido", tone: "success" },
  PENDING_VALIDATION: { label: "Em validação", tone: "info" },
  EXPIRED: { label: "Vencido", tone: "error" },
  INVALID: { label: "Inválido", tone: "error" },
  REVOKED: { label: "Revogado", tone: "neutral" },
};

export function CertificateStatusBadge({ status }: { status: CertificateStatus }) {
  // Fallback defensivo: a fiscal-api é um serviço versionado à parte; um status
  // novo (drift de enum) não pode derrubar o render.
  const meta = STATUS_META[status] ?? { label: String(status), tone: "neutral" };
  return <SemanticBadge label={meta.label} tone={meta.tone} />;
}
