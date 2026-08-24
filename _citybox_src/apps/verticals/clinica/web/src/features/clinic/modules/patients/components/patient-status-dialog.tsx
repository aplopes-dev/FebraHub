'use client';

import { ConfirmDialog } from '@citybox/ui/organisms';
import {
  getPatientStatusToggleMode,
  PATIENT_STATUS_TOGGLE_COPY,
} from '../lib/patient-status-toggle';
import type { ClinicPatient } from '../types/clinic-patient';

type PatientStatusDialogProps = {
  patient: ClinicPatient | null;
  open: boolean;
  isConfirming?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function PatientStatusDialog({
  patient,
  open,
  isConfirming = false,
  onOpenChange,
  onConfirm,
}: PatientStatusDialogProps) {
  if (!patient) {
    return null;
  }

  const mode = getPatientStatusToggleMode(patient.status);
  const copy = PATIENT_STATUS_TOGGLE_COPY[mode];

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description(patient.name)}
      confirmLabel={copy.confirmLabel}
      cancelLabel="Cancelar"
      confirmVariant={mode === 'deactivate' ? 'destructive' : 'default'}
      isConfirming={isConfirming}
      onConfirm={onConfirm}
    />
  );
}
