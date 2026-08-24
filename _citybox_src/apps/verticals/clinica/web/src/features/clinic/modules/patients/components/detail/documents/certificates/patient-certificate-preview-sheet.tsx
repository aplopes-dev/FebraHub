'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2, Printer } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import {
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS,
  CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { useStore } from '@/lib/store-context';
import { buildPatientCertificatePdfFromRecord } from '../../../../lib/build-patient-certificate-pdf-from-record';
import { buildPatientCertificatePdfFileName } from '../../../../lib/build-patient-certificate-pdf';
import { formatPatientContractIssuedLabel } from '../../../../lib/format-patient-contract-issued';
import { formatPatientCertificateTypeLabel } from '../../../../lib/format-patient-certificate-history';
import { mapClinicSettingsToPdfClinic } from '../../../../lib/patient-pdf-shared';
import {
  createPdfObjectUrl,
  downloadPatientDocumentPdf,
  printPatientDocumentPdf,
  revokePdfObjectUrl,
} from '../../../../lib/patient-document-pdf-actions';
import type { PatientAddress } from '../../../../types/clinic-patient';
import type { PatientCertificateRecord } from '../../../../types/patient-certificate';

type PatientCertificatePreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: PatientCertificateRecord | null;
  patientCpf?: string;
  patientAddress?: PatientAddress;
};

export function PatientCertificatePreviewSheet({
  open,
  onOpenChange,
  certificate,
  patientCpf,
  patientAddress,
}: PatientCertificatePreviewSheetProps) {
  const { storeId } = useStore();
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const clinicProfileQuery = useQuery({
    queryKey: ['clinic-profile', storeId],
    queryFn: () => getClinicProfile(storeId),
    enabled: Boolean(storeId) && open,
  });

  const clearPdfUrl = useCallback(() => {
    setPdfUrl((current) => {
      revokePdfObjectUrl(current);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!open || !certificate) {
      setPdfBlob(null);
      clearPdfUrl();
      return;
    }

    let cancelled = false;
    setIsGeneratingPdf(true);

    void (async () => {
      try {
        const clinic = clinicProfileQuery.data
          ? mapClinicSettingsToPdfClinic(clinicProfileQuery.data)
          : { clinicName: certificate.clinicName?.trim() || 'Clínica' };

        const blob = await buildPatientCertificatePdfFromRecord(certificate, {
          clinic,
          patientCpf,
          patientAddress,
        });

        if (!cancelled) {
          setPdfBlob(blob);
        }
      } catch {
        if (!cancelled) {
          setPdfBlob(null);
        }
      } finally {
        if (!cancelled) {
          setIsGeneratingPdf(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [certificate, clearPdfUrl, clinicProfileQuery.data, open, patientAddress, patientCpf]);

  useEffect(() => {
    if (!pdfBlob || !open) {
      clearPdfUrl();
      return;
    }

    const nextUrl = createPdfObjectUrl(pdfBlob);
    setPdfUrl((current) => {
      revokePdfObjectUrl(current);
      return nextUrl;
    });

    return () => {
      revokePdfObjectUrl(nextUrl);
    };
  }, [clearPdfUrl, open, pdfBlob]);

  useEffect(() => {
    return () => {
      clearPdfUrl();
    };
  }, [clearPdfUrl]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      clearPdfUrl();
    }
    onOpenChange(nextOpen);
  };

  const handlePrint = () => {
    if (!pdfBlob) {
      return;
    }

    printPatientDocumentPdf(pdfBlob);
  };

  const handleDownload = () => {
    if (!pdfBlob || !certificate) {
      return;
    }

    const fileName = buildPatientCertificatePdfFileName(
      certificate.patientName,
      new Date(certificate.issuedAt),
    );
    downloadPatientDocumentPdf(pdfBlob, fileName);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
        className={cn('flex flex-col gap-0 p-0', CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS)}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-3 text-left">
          <SheetTitle className="text-base leading-tight">Atestado</SheetTitle>
          {certificate ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
              <span className="font-medium text-foreground">
                {formatPatientCertificateTypeLabel(certificate.type)}
              </span>
              <span className="text-muted-foreground" aria-hidden>
                ·
              </span>
              <span className="font-medium text-foreground">{certificate.professionalName}</span>
              <span className="text-muted-foreground" aria-hidden>
                ·
              </span>
              <span className="text-muted-foreground">
                {formatPatientContractIssuedLabel(certificate.issuedAt, 'manual')}
              </span>
            </div>
          ) : null}
        </SheetHeader>

        <div className={cn(CLINIC_SHEET_SCROLL_BODY_CLASS, 'flex min-h-0 flex-1 flex-col bg-muted/30')}>
          {isGeneratingPdf ? (
            <div className="flex min-h-0 flex-1 items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Preparando atestado…
            </div>
          ) : pdfUrl ? (
            <iframe
              title={`Atestado de ${certificate?.patientName ?? 'paciente'}`}
              src={pdfUrl}
              className="min-h-0 flex-1 w-full border-0 bg-background"
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-background/80 text-sm text-muted-foreground">
              Não foi possível gerar o atestado.
            </div>
          )}
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => handleOpenChange(false)}
          >
            Fechar
          </Button>
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            disabled={!pdfBlob}
            onClick={handleDownload}
          >
            <Download className="mr-2 size-4" aria-hidden />
            Baixar arquivo
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            disabled={!pdfBlob}
            onClick={handlePrint}
          >
            <Printer className="mr-2 size-4" aria-hidden />
            Imprimir
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
