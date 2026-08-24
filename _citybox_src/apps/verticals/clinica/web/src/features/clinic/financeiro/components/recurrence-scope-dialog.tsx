"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  RadioGroup,
  RadioGroupItem,
  Label,
} from "@citybox/ui/atoms";
import type { RecurrenceScope } from "../hooks/use-update-recurrence-group";

interface RecurrenceScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (scope: RecurrenceScope) => void;
}

const OPTIONS: { value: RecurrenceScope; label: string; description: string }[] = [
  {
    value: "this",
    label: "Apenas este lançamento",
    description: "Somente este registro será alterado.",
  },
  {
    value: "this_and_future",
    label: "Este e os próximos",
    description: "Este e todos os lançamentos futuros do grupo serão alterados.",
  },
  {
    value: "all",
    label: "Todos os lançamentos do grupo",
    description: "Todos os lançamentos da recorrência serão alterados.",
  },
];

export function RecurrenceScopeDialog({
  open,
  onOpenChange,
  onConfirm,
}: RecurrenceScopeDialogProps) {
  const [scope, setScope] = useState<RecurrenceScope>("this");

  const handleConfirm = () => {
    onConfirm(scope);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar lançamento recorrente</DialogTitle>
        </DialogHeader>

        <RadioGroup
          value={scope}
          onValueChange={(v) => setScope(v as RecurrenceScope)}
          className="space-y-3 py-2"
        >
          {OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-start space-x-3">
              <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" />
              <Label htmlFor={opt.value} className="cursor-pointer space-y-0.5">
                <span className="font-medium">{opt.label}</span>
                <p className="text-sm text-muted-foreground font-normal">{opt.description}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
