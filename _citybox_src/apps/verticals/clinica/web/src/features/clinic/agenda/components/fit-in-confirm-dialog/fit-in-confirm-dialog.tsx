"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import { RadioGroup, RadioGroupItem } from "@citybox/ui/atoms";
import { Label } from "@citybox/ui/atoms";

import type { IFitIn } from "@/features/clinic/agenda/components/header/fit-in/types";

type FitInConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  fitIns: IFitIn[];
  onConfirm: (fitInId: string) => void;
  onSkip: () => void;
};

function getShiftLabel(shifts: IFitIn["shifts"]): string {
  if (shifts.includes("any")) return "Qualquer turno";
  return shifts.map((s) => (s === "morning" ? "Manhã" : "Tarde")).join(" + ");
}

export function FitInConfirmDialog({
  open,
  onOpenChange,
  patientName,
  fitIns,
  onConfirm,
  onSkip,
}: FitInConfirmDialogProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (open && fitIns.length > 0) {
      setSelectedId(fitIns[0].id);
    }
  }, [open, fitIns]);

  const handleConfirm = () => {
    if (selectedId) {
      onConfirm(selectedId);
    }
    onOpenChange(false);
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paciente com encaixe pendente</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{patientName}</span>{" "}
            possui {fitIns.length}{" "}
            {fitIns.length === 1 ? "encaixe" : "encaixes"} na lista de espera.
            Deseja vincular esta consulta ao encaixe?
          </DialogDescription>
        </DialogHeader>

        {fitIns.length > 1 && (
          <RadioGroup
            value={selectedId}
            onValueChange={setSelectedId}
            className="space-y-2 py-2"
          >
            {fitIns.map((fitIn) => {
              const dateLabel = fitIn.anyDate
                ? "Qualquer data"
                : fitIn.fitInDate
                  ? format(new Date(fitIn.fitInDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "—";

              return (
                <div
                  key={fitIn.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <RadioGroupItem value={fitIn.id} id={fitIn.id} className="mt-0.5" />
                  <Label htmlFor={fitIn.id} className="cursor-pointer space-y-0.5">
                    <span className="text-sm font-medium">{dateLabel}</span>
                    <div className="text-xs text-muted-foreground">
                      {getShiftLabel(fitIn.shifts)}
                      {fitIn.professional && ` · ${fitIn.professional.name}`}
                    </div>
                    {fitIn.observation && (
                      <div className="text-xs text-muted-foreground truncate max-w-64">
                        {fitIn.observation}
                      </div>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        )}

        {fitIns.length === 1 && (
          <div className="py-2 p-3 border rounded-lg space-y-0.5">
            <p className="text-sm font-medium">
              {fitIns[0].anyDate
                ? "Qualquer data"
                : fitIns[0].fitInDate
                  ? format(new Date(fitIns[0].fitInDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {getShiftLabel(fitIns[0].shifts)}
              {fitIns[0].professional && ` · ${fitIns[0].professional.name}`}
            </p>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 justify-end">
          <Button variant="ghost" onClick={handleSkip}>
            Não vincular
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            Sim, vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
