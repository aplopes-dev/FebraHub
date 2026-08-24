'use client';

import type { ComponentProps, RefObject } from 'react';
import type { PatientToothAnnotation } from '../../../types/patient-tooth-annotation';
import { PatientLocationAnnotationsDialog } from './patient-location-annotations-dialog';

type ToothAnchor = {
  getBoundingClientRect: () => DOMRect;
};

type PatientToothAnnotationsDialogProps = {
  toothNumber: number | null;
  anchorRef: RefObject<ToothAnchor | null>;
  annotations: readonly PatientToothAnnotation[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAnnotation: (toothNumber: number, content: string) => void | Promise<void>;
  onDeleteAnnotation: (
    toothNumber: number,
    annotationId: string,
  ) => void | Promise<void>;
};

/** Wrapper do odontograma sobre o popover genérico de anotações. */
export function PatientToothAnnotationsDialog({
  toothNumber,
  anchorRef,
  annotations,
  isSubmitting,
  onOpenChange,
  onAddAnnotation,
  onDeleteAnnotation,
}: PatientToothAnnotationsDialogProps) {
  return (
    <PatientLocationAnnotationsDialog
      locationKey={toothNumber == null ? null : String(toothNumber)}
      title={toothNumber == null ? '' : `Dente ${toothNumber}`}
      emptyMessage="Nenhuma anotação neste dente."
      anchorRef={anchorRef}
      annotations={annotations}
      isSubmitting={isSubmitting}
      onOpenChange={onOpenChange}
      onAddAnnotation={(locationKey, content) =>
        onAddAnnotation(Number(locationKey), content)
      }
      onDeleteAnnotation={(locationKey, annotationId) =>
        onDeleteAnnotation(Number(locationKey), annotationId)
      }
    />
  );
}

export type { PatientToothAnnotationsDialogProps };
export type PatientLocationAnnotationsDialogProps = ComponentProps<
  typeof PatientLocationAnnotationsDialog
>;
