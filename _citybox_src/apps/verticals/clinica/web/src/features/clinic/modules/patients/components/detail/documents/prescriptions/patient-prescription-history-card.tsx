'use client';

import { Eye, Trash2 } from 'lucide-react';
import { Button, Card, CardFooter, CardHeader } from '@citybox/ui/atoms';
import {
  formatPatientPrescriptionHistoryDescription,
  formatPatientPrescriptionHistoryTitle,
} from '../../../../lib/format-patient-prescription-history';
import type { PatientPrescriptionRecord } from '../../../../types/patient-prescription';

type PatientPrescriptionHistoryCardProps = {
  prescription: PatientPrescriptionRecord;
  onView: (prescription: PatientPrescriptionRecord) => void;
  onDelete: (prescription: PatientPrescriptionRecord) => void;
};

export function PatientPrescriptionHistoryCard({
  prescription,
  onView,
  onDelete,
}: PatientPrescriptionHistoryCardProps) {
  return (
    <Card className="gap-0 border-border/60 py-0 shadow-sm">
      <CardHeader className="gap-0 space-y-0.5 pb-2 pt-3">
        <p className="min-w-0 font-medium text-foreground">
          {formatPatientPrescriptionHistoryTitle(
            prescription.itemCount ?? prescription.items.length,
            prescription.issuedDate,
          )}
        </p>
        <p className="text-[12px] leading-snug text-muted-foreground">
          {formatPatientPrescriptionHistoryDescription(
            prescription.professionalName,
            prescription.issuedAt,
          )}
        </p>
      </CardHeader>

      <CardFooter className="gap-2 border-t-0 pb-3 pt-0">
        <Button type="button" className="h-10 min-w-0 flex-1" onClick={() => onView(prescription)}>
          <Eye className="mr-2 size-4 shrink-0" aria-hidden />
          Ver receituário
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 text-destructive hover:text-destructive"
          aria-label="Excluir receituário"
          onClick={() => onDelete(prescription)}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </CardFooter>
    </Card>
  );
}
