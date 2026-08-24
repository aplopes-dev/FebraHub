'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@citybox/ui';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@citybox/ui/atoms';
import {
  isAllEvolutionsSelected,
  isSomeEvolutionsSelected,
  selectAllEvolutionIds,
  toggleEvolutionSelection,
} from '../../../lib/patient-evolution-selection';
import { formatPatientTreatmentFinalizedDate } from '../../../lib/patient-treatment-ui';
import type { PatientTreatmentEvolution } from '../../../types/patient-treatment';

type PatientTreatmentEmitEvolutionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  evolutions: PatientTreatmentEvolution[];
  onEmit: (selectedIds: string[]) => void;
};

export function PatientTreatmentEmitEvolutionDialog({
  open,
  onOpenChange,
  patientName,
  evolutions,
  onEmit,
}: PatientTreatmentEmitEvolutionDialogProps) {
  const evolutionIds = useMemo(() => evolutions.map((evolution) => evolution.id), [evolutions]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIds([]);
  }, [open]);

  const allSelected = isAllEvolutionsSelected(evolutionIds, selectedIds);
  const someSelected = isSomeEvolutionsSelected(evolutionIds, selectedIds);
  const selectAllState = allSelected ? true : someSelected ? 'indeterminate' : false;

  const handleToggleAll = useCallback(
    (checked: boolean | 'indeterminate') => {
      if (checked === true) {
        setSelectedIds(selectAllEvolutionIds(evolutionIds));
        return;
      }

      setSelectedIds([]);
    },
    [evolutionIds],
  );

  const handleToggleOne = useCallback((evolutionId: string) => {
    setSelectedIds((current) => toggleEvolutionSelection(current, evolutionId));
  }, []);

  const handleEmit = () => {
    if (selectedIds.length === 0) {
      return;
    }

    onEmit(selectedIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,44rem)] w-full max-w-2xl flex-col gap-4 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="min-w-0 shrink-0">
          <DialogTitle>Emitir evolução</DialogTitle>
          <DialogDescription>
            Selecione uma ou mais evoluções de <span className="font-medium">{patientName}</span>{' '}
            para gerar o documento em PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/20">
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
            <Checkbox
              id="patient-evolution-select-all"
              checked={selectAllState}
              onCheckedChange={handleToggleAll}
              aria-label="Selecionar todas as evoluções"
            />
            <Label htmlFor="patient-evolution-select-all" className="text-sm font-medium">
              Selecionar todas
            </Label>
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedIds.length} de {evolutions.length} selecionada(s)
            </span>
          </div>

          <ul className="divide-y divide-border/60">
            {evolutions.map((evolution) => {
              const checkboxId = `patient-evolution-select-${evolution.id}`;
              const isSelected = selectedIds.includes(evolution.id);

              return (
                <li key={evolution.id}>
                  <label
                    htmlFor={checkboxId}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors',
                      isSelected ? 'bg-background/80' : 'hover:bg-background/50',
                    )}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleOne(evolution.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {evolution.description}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatPatientTreatmentFinalizedDate(evolution.finalizedAt)}
                        </span>
                      </div>
                      {evolution.professionalName ? (
                        <p className="text-xs font-medium text-muted-foreground">
                          {evolution.professionalName}
                        </p>
                      ) : null}
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {evolution.evolutionNotes}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={selectedIds.length === 0} onClick={handleEmit}>
            Emitir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
