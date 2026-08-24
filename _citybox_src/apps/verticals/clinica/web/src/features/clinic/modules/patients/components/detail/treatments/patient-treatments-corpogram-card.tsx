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
import { bodyRegionLabel } from '@/lib/body-regions';
import { useSession } from '@/lib/session-context';
import { partitionPatientTreatmentBodyRegions } from '../../../lib/patient-treatment-ui';
import type { PatientTreatment } from '../../../types/patient-treatment';
import { OdontogramBody } from '../budgets/corpogram/odontogram-body';
import { PatientLocationAnnotationsDialog } from './patient-location-annotations-dialog';
import {
  getPatientBodyRegionAnnotationMutationErrorMessage,
  usePatientBodyRegionAnnotationMutations,
  usePatientBodyRegionAnnotationsQuery,
} from '../../../hooks/use-patient-body-region-annotations-queries';

type PatientTreatmentsCorpogramCardProps = {
  patientId: string;
  treatments?: readonly PatientTreatment[];
  defaultPatientGender?: string | null;
};

export function PatientTreatmentsCorpogramCard({
  patientId,
  treatments = [],
  defaultPatientGender,
}: PatientTreatmentsCorpogramCardProps) {
  const { session } = useSession();
  const professionalName = session?.user.name?.trim() || 'Profissional';

  const annotationsQuery = usePatientBodyRegionAnnotationsQuery(patientId);
  const { createMutation, deleteMutation } =
    usePatientBodyRegionAnnotationMutations(patientId);

  const [showOpen, setShowOpen] = useState(true);
  const [showFinalized, setShowFinalized] = useState(true);
  const [notesRegionId, setNotesRegionId] = useState<string | null>(null);
  const [loadingRegionId, setLoadingRegionId] = useState<string | null>(null);
  const regionAnchorRef = useRef<{ getBoundingClientRect: () => DOMRect } | null>(
    null,
  );

  const annotations = annotationsQuery.data ?? [];

  const { openRegionIds, finalizedRegionIds } = useMemo(() => {
    const partitioned = partitionPatientTreatmentBodyRegions(treatments);
    return {
      openRegionIds: showOpen ? partitioned.openRegionIds : [],
      finalizedRegionIds: showFinalized ? partitioned.finalizedRegionIds : [],
    };
  }, [treatments, showOpen, showFinalized]);

  const activeAnnotations = useMemo(
    () =>
      notesRegionId == null
        ? []
        : annotations.filter((item) => item.bodyRegionId === notesRegionId),
    [annotations, notesRegionId],
  );

  const annotatedRegionIds = useMemo(
    () => [...new Set(annotations.map((item) => item.bodyRegionId))],
    [annotations],
  );

  const handleRegionOpen = async (regionId: string) => {
    if (loadingRegionId != null) return;

    const el = document.querySelector(`[data-region="${regionId}"]`);
    if (el instanceof Element) {
      regionAnchorRef.current = {
        getBoundingClientRect: () => el.getBoundingClientRect(),
      };
    } else {
      regionAnchorRef.current = null;
    }

    setLoadingRegionId(regionId);

    try {
      await annotationsQuery.refetch();
      setNotesRegionId(regionId);
    } catch (error) {
      toast.error(getPatientBodyRegionAnnotationMutationErrorMessage(error));
    } finally {
      setLoadingRegionId(null);
    }
  };

  const handleAddAnnotation = async (regionId: string, content: string) => {
    try {
      await createMutation.mutateAsync({
        bodyRegionId: regionId,
        content,
        professionalName,
      });
    } catch (error) {
      toast.error(getPatientBodyRegionAnnotationMutationErrorMessage(error));
      throw error;
    }
  };

  const handleDeleteAnnotation = async (
    _regionId: string,
    annotationId: string,
  ) => {
    try {
      await deleteMutation.mutateAsync(annotationId);
    } catch (error) {
      toast.error(getPatientBodyRegionAnnotationMutationErrorMessage(error));
      throw error;
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-3 md:p-4">
      <Accordion
        type="single"
        collapsible
        defaultValue="corpogram"
        className="w-full overflow-visible rounded-none border-0"
      >
        <AccordionItem value="corpogram" className="border-0 data-[state=open]:bg-transparent">
          <AccordionTrigger className="gap-2 rounded-xl bg-background px-4 py-3 hover:no-underline **:data-[slot=accordion-trigger-icon]:ml-0">
            <h3 className="min-w-0 flex-1 text-left text-base font-semibold text-foreground">
              Mapa anatômico
            </h3>
            <span className="shrink-0 text-sm font-medium text-foreground">
              <span className="group-aria-expanded/accordion-trigger:hidden">Abrir</span>
              <span className="hidden group-aria-expanded/accordion-trigger:inline">Fechar</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-1 pt-3 pb-1">
            <OdontogramBody
              selectedRegionIds={[]}
              openRegionIds={openRegionIds}
              finalizedRegionIds={finalizedRegionIds}
              annotatedRegionIds={annotatedRegionIds}
              loadingRegionId={loadingRegionId}
              defaultPatientGender={defaultPatientGender}
              readOnly
              onRegionToggle={() => undefined}
              onRegionOpen={(regionId) => {
                void handleRegionOpen(regionId);
              }}
            />

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
                  <span
                    className="inline-block size-5 shrink-0 rounded-full border-2 border-[#CA8A04] bg-[#CA8A04]/35"
                    aria-hidden
                  />
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={showFinalized}
                    onCheckedChange={(checked) => setShowFinalized(checked === true)}
                    aria-label="Finalizado"
                  />
                  <span>Finalizado</span>
                  <span
                    className="inline-block size-5 shrink-0 rounded-full border-2 border-[#16A34A] bg-[#16A34A]/35"
                    aria-hidden
                  />
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <PatientLocationAnnotationsDialog
        locationKey={notesRegionId}
        title={notesRegionId ? bodyRegionLabel(notesRegionId) : ''}
        emptyMessage="Nenhuma anotação nesta região."
        anchorRef={regionAnchorRef}
        annotations={activeAnnotations}
        isSubmitting={createMutation.isPending || deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setNotesRegionId(null);
            regionAnchorRef.current = null;
          }
        }}
        onAddAnnotation={handleAddAnnotation}
        onDeleteAnnotation={handleDeleteAnnotation}
      />
    </div>
  );
}
