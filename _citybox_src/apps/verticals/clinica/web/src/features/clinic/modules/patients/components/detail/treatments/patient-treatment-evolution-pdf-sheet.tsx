'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileSignature, Printer } from 'lucide-react';
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
import { buildPatientEvolutionPdfFileName } from '../../../lib/build-patient-evolution-pdf';
import {
  createPdfObjectUrl,
  downloadPatientEvolutionPdf,
  printPatientEvolutionPdf,
  revokePdfObjectUrl,
} from '../../../lib/patient-evolution-pdf-actions';

export type PatientTreatmentEvolutionPdfSheetMode = 'view' | 'request-signature';

type PatientTreatmentEvolutionPdfSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  pdfBlob: Blob | null;
  mode?: PatientTreatmentEvolutionPdfSheetMode;
  onRequestSignature?: () => void;
  isRequestingSignature?: boolean;
};

export function PatientTreatmentEvolutionPdfSheet({
  open,
  onOpenChange,
  patientName,
  pdfBlob,
  mode = 'view',
  onRequestSignature,
  isRequestingSignature = false,
}: PatientTreatmentEvolutionPdfSheetProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const isRequestMode = mode === 'request-signature';

  const fileName = useMemo(
    () => buildPatientEvolutionPdfFileName(patientName),
    [patientName],
  );

  const clearPdfUrl = useCallback(() => {
    setPdfUrl((current) => {
      revokePdfObjectUrl(current);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!open || !pdfBlob) {
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

  const handleDownload = () => {
    if (!pdfBlob) {
      return;
    }

    downloadPatientEvolutionPdf(pdfBlob, fileName);
  };

  const handlePrint = () => {
    if (!pdfBlob) {
      return;
    }

    printPatientEvolutionPdf(pdfBlob);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        {...CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_PROPS}
        className={cn('flex flex-col gap-0 p-0', CLINIC_FULLSCREEN_BOTTOM_SHEET_CONTENT_CLASS)}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Pré-visualização da evolução de {patientName}</SheetTitle>
        </SheetHeader>

        <div className={cn(CLINIC_SHEET_SCROLL_BODY_CLASS, 'flex min-h-0 flex-1 flex-col bg-muted/30')}>
          {pdfUrl ? (
            <iframe
              title={`Pré-visualização da evolução de ${patientName}`}
              src={pdfUrl}
              className="min-h-0 flex-1 w-full border-0 bg-background"
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-background/80 text-sm text-muted-foreground">
              Preparando documento…
            </div>
          )}
        </div>

        <SheetFooter
          className={cn(
            CLINIC_SHEET_FOOTER_CLASS,
            'flex-col-reverse gap-2 px-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6',
          )}
        >
          <Button
            type="button"
            variant="outline"
            className={cn(
              CLINIC_SHEET_FOOTER_BUTTON_CLASS,
              'w-full min-w-0 sm:w-auto sm:min-w-[8.5rem]',
            )}
            onClick={() => handleOpenChange(false)}
          >
            Fechar
          </Button>
          {isRequestMode ? (
            <Button
              type="button"
              className={cn(
                CLINIC_SHEET_FOOTER_BUTTON_CLASS,
                'w-full min-w-0 sm:w-auto sm:min-w-[10rem]',
              )}
              disabled={!pdfBlob || isRequestingSignature || !onRequestSignature}
              onClick={() => onRequestSignature?.()}
            >
              <FileSignature className="mr-2 size-4 shrink-0" aria-hidden />
              {isRequestingSignature ? 'Solicitando…' : 'Solicitar assinatura'}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
                  'w-full min-w-0 sm:w-auto sm:min-w-[8.5rem]',
                )}
                disabled={!pdfBlob}
                onClick={handleDownload}
              >
                <Download className="mr-2 size-4 shrink-0" aria-hidden />
                Baixar arquivo
              </Button>
              <Button
                type="button"
                className={cn(
                  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
                  'w-full min-w-0 sm:w-auto sm:min-w-[8.5rem]',
                )}
                disabled={!pdfBlob}
                onClick={handlePrint}
              >
                <Printer className="mr-2 size-4 shrink-0" aria-hidden />
                Imprimir
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
