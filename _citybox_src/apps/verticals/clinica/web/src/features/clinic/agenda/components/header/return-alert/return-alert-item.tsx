'use client';

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, EllipsisVertical, Info, Trash2 } from "lucide-react";

import { Button } from "@citybox/ui/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@citybox/ui/atoms";
import { Avatar, AvatarFallback } from "@citybox/ui/atoms";

import type { IReturnAlert } from "./types";

type ReturnAlertItemProps = {
  alert: IReturnAlert;
  onSchedule?: (alert: IReturnAlert) => void;
  onDelete?: (alert: IReturnAlert) => void;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ReturnAlertItem({
  alert,
  onSchedule,
  onDelete,
}: ReturnAlertItemProps) {
  const observation =
    alert.reason?.trim() || "Nenhuma observação registrada para este alerta.";

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="text-base">
            {getInitials(alert.patient.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{alert.patient.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {alert.patient.phone}
          </p>
        </div>
      </div>

      <div className="min-w-0 sm:w-40 sm:shrink-0">
        <p className="text-sm font-medium">
          {format(new Date(alert.returnDate), "dd/MM/yyyy", { locale: ptBR })}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {alert.professional.name}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Ver observação do alerta"
            >
              <Info className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={6} className="max-w-xs">
            <p className="text-pretty">{observation}</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSchedule?.(alert)}>
              <Calendar className="size-4" />
              Agendar
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete?.(alert)}
            >
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export { ReturnAlertItem };
