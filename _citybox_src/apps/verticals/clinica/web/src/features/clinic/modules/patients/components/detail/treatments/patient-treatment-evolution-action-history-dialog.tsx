'use client';

import { useMemo } from 'react';
import {
  Avatar,
  AvatarFallback,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { usePatientEvolutionHistoryQuery } from '../../../hooks/use-patient-evolutions-queries';
import {
  formatEvolutionHistoryEntryDescription,
  getEvolutionHistoryProfessionalInitials,
  resolveEvolutionActionHistory,
} from '../../../lib/patient-treatment-evolution-history';
import type { PatientTreatmentEvolution } from '../../../types/patient-treatment';

type PatientTreatmentEvolutionActionHistoryDialogProps = {
  evolution: PatientTreatmentEvolution | null;
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PatientTreatmentEvolutionActionHistoryDialog({
  evolution,
  patientId,
  open,
  onOpenChange,
}: PatientTreatmentEvolutionActionHistoryDialogProps) {
  const historyQuery = usePatientEvolutionHistoryQuery(
    patientId,
    evolution?.id ?? null,
    open && evolution !== null,
  );

  const entries = useMemo(() => {
    if (historyQuery.data?.length) {
      return [...historyQuery.data].sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
      );
    }

    return evolution ? resolveEvolutionActionHistory(evolution) : [];
  }, [evolution, historyQuery.data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-5">
        <DialogHeader className="min-w-0 shrink-0">
          <DialogTitle>Histórico de ações</DialogTitle>
          <DialogDescription className="sr-only">
            Registro de modificações da evolução clínica.
          </DialogDescription>
        </DialogHeader>

        {historyQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando histórico…</p>
        ) : null}

        {historyQuery.isError ? (
          <p className="text-sm text-destructive">Não foi possível carregar o histórico.</p>
        ) : null}

        <ul className="max-h-[min(60dvh,24rem)] space-y-6 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <li key={entry.id}>
              <div className="flex items-start gap-3">
                <Avatar className="size-10 shrink-0 border border-border/40">
                  <AvatarFallback className="bg-muted/60 text-sm font-medium text-muted-foreground">
                    {getEvolutionHistoryProfessionalInitials(entry.professionalName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1 pt-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {entry.professionalName}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {formatEvolutionHistoryEntryDescription(entry)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
