"use client";

import { SemanticBadge } from "@/components/ui/status/semantic-badge";

export type ActiveStatusBadgeProps = {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
};

export function ActiveStatusBadge({
  active,
  activeLabel = "Ativo",
  inactiveLabel = "Inativo",
}: ActiveStatusBadgeProps) {
  return (
    <SemanticBadge
      label={active ? activeLabel : inactiveLabel}
      tone={active ? "success" : "warning"}
    />
  );
}
