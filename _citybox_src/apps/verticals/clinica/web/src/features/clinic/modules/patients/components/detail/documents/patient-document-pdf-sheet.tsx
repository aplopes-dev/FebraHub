'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
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
import {
  createPdfObjectUrl,
  downloadPatientDocumentPdf,
  printPatientDocumentPdf,
  revokePdfObjectUrl,
} from '../../../lib/patient-document-pdf-actions';

type PatientDocumentPdfSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fileName: string;
  pdfBlob: Blob | null;
};

export function PatientDocumentPdfSheet({
  open,
  onOpenChange,
  title,
  fileName,
  pdfBlob,
}: PatientDocumentPdfSheetProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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

    downloadPatientDocumentPdf(pdfBlob, fileName);
  };

  const handlePrint = () => {
    if (!pdfBlob) {
      return;
    }

    printPatientDocumentPdf(pdfBlob);
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
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className={cn(CLINIC_SHEET_SCROLL_BODY_CLASS, 'flex min-h-0 flex-1 flex-col bg-muted/30')}>
          {pdfUrl ? (
            <iframe
              title={title}
              src={pdfUrl}
              className="min-h-0 flex-1 w-full border-0 bg-background"
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-background/80 text-sm text-muted-foreground">
              Preparando documento…
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
