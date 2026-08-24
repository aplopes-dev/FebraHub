'use client';

import { PlusIcon } from "lucide-react";

import { Button } from "@citybox/ui/atoms";

import { useSchedulingSheet } from "./contexts/scheduling-sheet-context";
import { useSchedulePermissions } from "./hooks/use-schedule-permissions";

type ButtonNewSchedulingProps = {
  /** Mobile: só ícone + “Novo” para caber ao lado do seletor de profissional. */
  compact?: boolean;
};

export function ButtonNewScheduling({ compact = false }: ButtonNewSchedulingProps) {
  const { openSheet } = useSchedulingSheet();
  const { canCreateScheduling } = useSchedulePermissions();

  if (!canCreateScheduling) return null;

  return (
    <Button onClick={() => openSheet()} className={compact ? "px-3" : undefined}>
      <PlusIcon className="h-4 w-4" />
      {compact ? "Novo" : "Novo agendamento"}
    </Button>
  );
}
