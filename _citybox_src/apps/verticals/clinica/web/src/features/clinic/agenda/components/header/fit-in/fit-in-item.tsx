'use client';

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  EllipsisVertical,
  Info,
  Pencil,
  Trash2,
} from "lucide-react";

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

import type { IFitIn, TFitInShift } from "./types";

type FitInItemProps = {
  fitIn: IFitIn;
  onSchedule?: (fitIn: IFitIn) => void;
  onEdit?: (fitIn: IFitIn) => void;
  onDelete?: (fitIn: IFitIn) => void;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getShiftLabel(shifts: TFitInShift[]): string {
  if (shifts.includes("any")) return "Qualquer turno";
  return shifts.map((s) => (s === "morning" ? "Manhã" : "Tarde")).join(" + ");
}

function FitInItem({ fitIn, onSchedule, onEdit, onDelete }: FitInItemProps) {
  const dateDisplay = fitIn.anyDate
    ? "Qualquer data"
    : fitIn.fitInDate
      ? format(new Date(fitIn.fitInDate), "dd/MM/yyyy", { locale: ptBR })
      : "-";

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary">{dateDisplay}</p>
        <div className="mt-1 flex items-center gap-2">
          <Avatar className="size-6 shrink-0">
            <AvatarFallback className="text-xs">
              {getInitials(fitIn.patient.name)}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-sm">{fitIn.patient.name}</p>
        </div>
      </div>

      <div className="min-w-0 sm:w-40 sm:shrink-0">
        <p className="truncate text-sm font-medium">{fitIn.planName ?? "—"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {fitIn.professional?.name ?? "Qualquer profissional"}
        </p>
        <p className="text-xs text-muted-foreground">
          {getShiftLabel(fitIn.shifts)}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <Info className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p>{fitIn.observation || "Sem observação"}</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSchedule?.(fitIn)}>
              <Calendar className="size-4" />
              Agendar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(fitIn)}>
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete?.(fitIn)}
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

export { FitInItem };
