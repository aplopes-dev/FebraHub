'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@citybox/ui/atoms';
import { formatPatientTreatmentLabel } from '../../../lib/patient-treatment-ui';
import type { PatientTreatment } from '../../../types/patient-treatment';

type PatientTreatmentViewDialogProps = {
  treatment: PatientTreatment | null;
  onOpenChange: (open: boolean) => void;
};

function displayValue(value: string | undefined | null): string {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : '—';
}

export function PatientTreatmentViewDialog({
  treatment,
  onOpenChange,
}: PatientTreatmentViewDialogProps) {
  const open = treatment !== null;
  const treatmentLabel = treatment ? formatPatientTreatmentLabel(treatment) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden bg-muted p-2 sm:max-w-xl"
      >
        <div className="flex flex-col overflow-hidden rounded-[10px] border bg-background">
          <div className="px-6 py-4">
            <DialogTitle className="text-base font-semibold leading-none">
              Visualizar procedimento
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes do procedimento finalizado em somente leitura.
            </DialogDescription>
          </div>

          <div className="space-y-4 px-6 pb-5">
            <div className="space-y-1.5">
              <Label htmlFor="patient-treatment-view-name">Procedimento</Label>
              <Input
                id="patient-treatment-view-name"
                value={treatmentLabel}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patient-treatment-view-professional">Profissional</Label>
              <Input
                id="patient-treatment-view-professional"
                value={displayValue(treatment?.professionalName)}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patient-treatment-view-diagnosis">Diagnóstico</Label>
              <Textarea
                id="patient-treatment-view-diagnosis"
                value={displayValue(treatment?.diagnosis)}
                readOnly
                disabled
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="patient-treatment-view-observation">Observação</Label>
              <Textarea
                id="patient-treatment-view-observation"
                value={displayValue(treatment?.observation)}
                readOnly
                disabled
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center justify-end border-t px-6 py-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
