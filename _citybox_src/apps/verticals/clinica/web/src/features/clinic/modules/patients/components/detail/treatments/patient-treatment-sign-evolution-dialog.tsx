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
} from '@citybox/ui/atoms';
import {
  isAllEvolutionsSelected,
  isSomeEvolutionsSelected,
  selectAllEvolutionIds,
  toggleEvolutionSelection,
} from '../../../lib/patient-evolution-selection';
import type { PatientTreatmentEvolution } from '../../../types/patient-treatment';

function formatEvolutionListDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

type PatientTreatmentSignEvolutionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  evolutions: PatientTreatmentEvolution[];
  onConfirm: (selectedIds: string[]) => void | Promise<void>;
};

export function PatientTreatmentSignEvolutionDialog({
  open,
  onOpenChange,
  patientName,
  evolutions,
  onConfirm,
}: PatientTreatmentSignEvolutionDialogProps) {
  const signableEvolutions = useMemo(
    () => evolutions.filter((evolution) => evolution.signatureStatus === 'unsigned'),
    [evolutions],
  );
  const evolutionIds = useMemo(
    () => signableEvolutions.map((evolution) => evolution.id),
    [signableEvolutions],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emitting, setEmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedIds([]);
    setEmitting(false);
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

  const handleConfirm = () => {
    if (selectedIds.length === 0 || emitting) {
      return;
    }

    setEmitting(true);
    void Promise.resolve(onConfirm(selectedIds))
      .then(() => {
        onOpenChange(false);
      })
      .finally(() => {
        setEmitting(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,44rem)] w-full max-w-3xl flex-col gap-4 overflow-hidden sm:max-w-3xl">
        <DialogHeader className="min-w-0 shrink-0">
          <DialogTitle>Solicitar assinatura eletrônica</DialogTitle>
          <DialogDescription>
            Selecione as evoluções de <span className="font-medium">{patientName}</span> que
            deseja incluir no documento. Um único PDF gera <strong>1 crédito</strong> ZapSign.
          </DialogDescription>
        </DialogHeader>

        {signableEvolutions.length === 0 ? (
          <p className="rounded-xl border border-border/60 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Não há evoluções sem assinatura disponíveis para solicitar.
          </p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/20">
            <div className="sticky top-0 z-10 grid grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.7fr)] items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
              <Checkbox
                id="patient-evolution-sign-select-all"
                checked={selectAllState}
                onCheckedChange={handleToggleAll}
                aria-label="Selecionar todas as evoluções"
              />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Evoluções
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Profissional
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Data
              </span>
            </div>

            <ul className="divide-y divide-border/60">
              {signableEvolutions.map((evolution) => {
                const checkboxId = `patient-evolution-sign-${evolution.id}`;
                const isSelected = selectedIds.includes(evolution.id);

                return (
                  <li key={evolution.id}>
                    <label
                      htmlFor={checkboxId}
                      className={cn(
                        'grid cursor-pointer grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.7fr)] items-start gap-3 px-4 py-3 transition-colors',
                        isSelected ? 'bg-background/80' : 'hover:bg-background/50',
                      )}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleOne(evolution.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">
                          {evolution.description}
                        </p>
                        {evolution.evolutionNotes ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {evolution.evolutionNotes}
                          </p>
                        ) : null}
                      </div>
                      <p className="min-w-0 truncate pt-0.5 text-sm text-foreground">
                        {evolution.professionalName || '—'}
                      </p>
                      <p className="pt-0.5 text-sm text-foreground">
                        {formatEvolutionListDate(evolution.finalizedAt)}
                      </p>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <DialogFooter className="shrink-0 gap-2 sm:gap-3">
          <span className="mr-auto self-center text-xs text-muted-foreground">
            {selectedIds.length} de {signableEvolutions.length} selecionada(s)
          </span>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={selectedIds.length === 0 || emitting}
            onClick={handleConfirm}
          >
            {emitting ? 'Emitindo…' : 'Emitir documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
