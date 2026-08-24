'use client';

import { Eye, Trash2 } from 'lucide-react';
import { Button, Card, CardFooter, CardHeader } from '@citybox/ui/atoms';
import {
  formatPatientCertificateHistoryDescription,
  formatPatientCertificateHistoryTitle,
} from '../../../../lib/format-patient-certificate-history';
import type { PatientCertificateRecord } from '../../../../types/patient-certificate';

type PatientCertificateHistoryCardProps = {
  certificate: PatientCertificateRecord;
  onView: (certificate: PatientCertificateRecord) => void;
  onDelete: (certificate: PatientCertificateRecord) => void;
};

export function PatientCertificateHistoryCard({
  certificate,
  onView,
  onDelete,
}: PatientCertificateHistoryCardProps) {
  return (
    <Card className="gap-0 border-border/60 py-0 shadow-sm">
      <CardHeader className="gap-0 space-y-0.5 pb-2 pt-3">
        <p className="min-w-0 font-medium text-foreground">
          {formatPatientCertificateHistoryTitle(certificate)}
        </p>
        <p className="text-[12px] leading-snug text-muted-foreground">
          {formatPatientCertificateHistoryDescription(
            certificate.professionalName,
            certificate.issuedAt,
          )}
        </p>
      </CardHeader>

      <CardFooter className="gap-2 border-t-0 pb-3 pt-0">
        <Button type="button" className="h-10 min-w-0 flex-1" onClick={() => onView(certificate)}>
          <Eye className="mr-2 size-4 shrink-0" aria-hidden />
          Ver atestado
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 text-destructive hover:text-destructive"
          aria-label="Excluir atestado"
          onClick={() => onDelete(certificate)}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </CardFooter>
    </Card>
  );
}
