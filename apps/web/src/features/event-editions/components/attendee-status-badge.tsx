"use client";

import { SemanticBadge, type SemanticTone } from "@/components/ui/status";
import type { AttendeeStatus } from "@/lib/mock-db";

const MAP: Record<AttendeeStatus, { label: string; tone: SemanticTone }> = {
  esperado: { label: "Esperado", tone: "neutral" },
  presente: { label: "Na sala", tone: "info" },
  abordado: { label: "Abordado", tone: "info" },
  matriculado: { label: "Matriculado", tone: "success" },
  pensando: { label: "Vai pensar", tone: "warning" },
  recusou: { label: "Recusou", tone: "error" },
  no_show: { label: "Não veio", tone: "neutral" },
};

export function attendeeStatusLabel(status: AttendeeStatus): string {
  return MAP[status].label;
}

export function AttendeeStatusBadge({ status }: { status: AttendeeStatus }) {
  const item = MAP[status];
  return <SemanticBadge label={item.label} tone={item.tone} />;
}
