'use client';

import { PatientCancelSignatureDialog } from '../signatures/patient-cancel-signature-dialog';

type PatientAnamnesisCancelSignatureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCancelling?: boolean;
  onConfirm: () => void | Promise<void>;
};

/** @deprecated Prefer `PatientCancelSignatureDialog` (copy genérica). */
export function PatientAnamnesisCancelSignatureDialog(
  props: PatientAnamnesisCancelSignatureDialogProps,
) {
  return <PatientCancelSignatureDialog {...props} />;
}
