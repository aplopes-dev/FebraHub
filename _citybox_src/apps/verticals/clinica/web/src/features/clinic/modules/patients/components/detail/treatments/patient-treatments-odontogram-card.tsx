'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
  Separator,
} from '@citybox/ui/atoms';
import { toast } from 'sonner';
import { useSession } from '@/lib/session-context';
import { partitionPatientTreatmentTeeth } from '../../../lib/patient-treatment-ui';
import type { PatientTreatment } from '../../../types/patient-treatment';
import { PatientBudgetOdontogram } from '../budgets/odontogram/patient-budget-odontogram';
import { PatientToothAnnotationsDialog } from './patient-tooth-annotations-dialog';
import {
  getPatientToothAnnotationMutationErrorMessage,
  usePatientToothAnnotationMutations,
  usePatientToothAnnotationsQuery,
} from '../../../hooks/use-patient-tooth-annotations-queries';

type StatusToothTone = 'open' | 'finalized';

const STATUS_TOOTH_STYLE: Record<
  StatusToothTone,
  { outline: string; fillFilter: string }
> = {
  open: {
    outline: '#CA8A04',
    fillFilter: 'sepia(0.5) saturate(2) hue-rotate(5deg) brightness(1.08)',
  },
  finalized: {
    outline: '#16A34A',
    fillFilter: 'sepia(0.5) saturate(1.8) hue-rotate(70deg) brightness(1.02)',
  },
};

/** Emoji 🦷 com contorno neon + interior mais opaco. */
function StatusToothEmoji({ tone }: { tone: StatusToothTone }) {
  const { outline, fillFilter } = STATUS_TOOTH_STYLE[tone];

  return (
    <span className="relative inline-flex size-5 shrink-0 items-center justify-center" aria-hidden>
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-base leading-none"
        style={{
          filter: [
            `drop-shadow(0 0 1px ${outline})`,
            `drop-shadow(0 0 1px ${outline})`,
            `drop-shadow(0 0 1px ${outline})`,
            `drop-shadow(0 0 1.25px ${outline})`,
          ].join(' '),
        }}
      >
        🦷
      </span>
      <span
        className="relative text-base leading-none opacity-55"
        style={{ filter: fillFilter }}
      >
        🦷
      </span>
    </span>
  );
}

type PatientTreatmentsOdontogramCardProps = {
  patientId: string;
  treatments?: readonly PatientTreatment[];
};

export function PatientTreatmentsOdontogramCard({
  patientId,
  treatments = [],
}: PatientTreatmentsOdontogramCardProps) {
  const { session } = useSession();
  const professionalName = session?.user.name?.trim() || 'Profissional';

  const annotationsQuery = usePatientToothAnnotationsQuery(patientId);
  const { createMutation, deleteMutation } = usePatientToothAnnotationMutations(patientId);

  const [showOpen, setShowOpen] = useState(true);
  const [showFinalized, setShowFinalized] = useState(true);
  const [notesToothNumber, setNotesToothNumber] = useState<number | null>(null);
  const [loadingToothNumber, setLoadingToothNumber] = useState<number | null>(null);
  const toothAnchorRef = useRef<HTMLElement | null>(null);

  const annotations = annotationsQuery.data ?? [];

  const { openToothNumbers, finalizedToothNumbers } = useMemo(() => {
    const partitioned = partitionPatientTreatmentTeeth(treatments);
    return {
      openToothNumbers: showOpen ? partitioned.openToothNumbers : [],
      finalizedToothNumbers: showFinalized ? partitioned.finalizedToothNumbers : [],
    };
  }, [treatments, showOpen, showFinalized]);

  const activeAnnotations = useMemo(
    () =>
      notesToothNumber == null
        ? []
        : annotations.filter((item) => item.toothNumber === notesToothNumber),
    [annotations, notesToothNumber],
  );

  const annotatedToothNumbers = useMemo(
    () => [...new Set(annotations.map((item) => item.toothNumber))],
    [annotations],
  );

  const handleToothOpen = async (toothNumber: number) => {
    if (loadingToothNumber != null) return;

    const el = document.querySelector(`[data-tooth="${toothNumber}"]`);
    toothAnchorRef.current = el instanceof HTMLElement ? el : null;
    setLoadingToothNumber(toothNumber);

    try {
      await annotationsQuery.refetch();
      setNotesToothNumber(toothNumber);
    } catch (error) {
      toast.error(getPatientToothAnnotationMutationErrorMessage(error));
    } finally {
      setLoadingToothNumber(null);
    }
  };

  const handleAddAnnotation = async (toothNumber: number, content: string) => {
    try {
      await createMutation.mutateAsync({
        toothNumber,
        content,
        professionalName,
      });
    } catch (error) {
      toast.error(getPatientToothAnnotationMutationErrorMessage(error));
      throw error;
    }
  };

  const handleDeleteAnnotation = async (_toothNumber: number, annotationId: string) => {
    try {
      await deleteMutation.mutateAsync(annotationId);
    } catch (error) {
      toast.error(getPatientToothAnnotationMutationErrorMessage(error));
      throw error;
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-3 md:p-4">
      <Accordion
        type="single"
        collapsible
        defaultValue="odontogram"
        className="w-full overflow-visible rounded-none border-0"
      >
        <AccordionItem value="odontogram" className="border-0 data-[state=open]:bg-transparent">
          <AccordionTrigger className="gap-2 rounded-xl bg-background px-4 py-3 hover:no-underline **:data-[slot=accordion-trigger-icon]:ml-0">
            <h3 className="min-w-0 flex-1 text-left text-base font-semibold text-foreground">
              Odontograma
            </h3>
            <span className="shrink-0 text-sm font-medium text-foreground">
              <span className="group-aria-expanded/accordion-trigger:hidden">Abrir</span>
              <span className="hidden group-aria-expanded/accordion-trigger:inline">Fechar</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-1 pt-3 pb-1">
            <PatientBudgetOdontogram
              value={[]}
              onChange={() => undefined}
              showHof={false}
              openToothNumbers={openToothNumbers}
              finalizedToothNumbers={finalizedToothNumbers}
              annotatedToothNumbers={annotatedToothNumbers}
              loadingToothNumber={loadingToothNumber}
              onToothOpen={(toothNumber) => {
                void handleToothOpen(toothNumber);
              }}
              dentalFooter={
                <div className="mt-5 space-y-4">
                  <Separator />

                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={showOpen}
                        onCheckedChange={(checked) => setShowOpen(checked === true)}
                        aria-label="Aberto"
                      />
                      <span>Aberto</span>
                      <StatusToothEmoji tone="open" />
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        checked={showFinalized}
                        onCheckedChange={(checked) => setShowFinalized(checked === true)}
                        aria-label="Finalizado"
                      />
                      <span>Finalizado</span>
                      <StatusToothEmoji tone="finalized" />
                    </label>

                    <span
                      aria-hidden
                      className="mx-1 h-4 w-0.5 shrink-0 self-center bg-border"
                    />

                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-normal text-foreground">Anotações</h4>
                      <span
                        className="text-base font-bold leading-none text-purple-800"
                        aria-hidden
                      >
                        !
                      </span>
                    </div>
                  </div>
                </div>
              }
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <PatientToothAnnotationsDialog
        toothNumber={notesToothNumber}
        anchorRef={toothAnchorRef}
        annotations={activeAnnotations}
        isSubmitting={createMutation.isPending || deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setNotesToothNumber(null);
            toothAnchorRef.current = null;
          }
        }}
        onAddAnnotation={handleAddAnnotation}
        onDeleteAnnotation={handleDeleteAnnotation}
      />
    </div>
  );
}
