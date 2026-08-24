"use client";

import { ActiveStatusBadge } from "@/components/ui/status";

type PriceListStatusBadgeProps = {
  active: boolean;
};

export function PriceListStatusBadge({ active }: PriceListStatusBadgeProps) {
  return (
    <ActiveStatusBadge
      active={active}
      activeLabel="Ativa"
      inactiveLabel="Inativa"
    />
  );
}
