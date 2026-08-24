'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@citybox/ui/atoms';
import { preventDialogDismissOnToast } from '@/components/toast';
import { buildReceiptPdf } from '../lib/build-receipt-pdf';
import {
  createPdfObjectUrl,
  printPdfBlob,
  revokePdfObjectUrl,
} from '../lib/receipt-pdf-actions';
import type { ReceiptData } from '../types/receipt';

type ReceiptPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptData | null;
};

/**
 * Visualização do recibo em PDF (iframe) + ação de imprimir.
 */
export function ReceiptPreviewModal({
  open,
  onOpenChange,
  receipt,
}: ReceiptPreviewModalProps) {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const clearPdfUrl = useCallback(() => {
    setPdfUrl((current) => {
      revokePdfObjectUrl(current);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!open || !receipt) {
      setPdfBlob(null);
      clearPdfUrl();
      return;
    }

    let cancelled = false;
    setIsGenerating(true);

    void (async () => {
      try {
        const blob = await buildReceiptPdf(receipt);
        if (!cancelled) setPdfBlob(blob);
      } catch {
        if (!cancelled) setPdfBlob(null);
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearPdfUrl, open, receipt]);

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
      setPdfBlob(null);
    }
    onOpenChange(nextOpen);
  };

  const handlePrint = () => {
    if (!pdfBlob) return;
    printPdfBlob(pdfBlob);
  };

  const isPdfReady = Boolean(pdfUrl) && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={preventDialogDismissOnToast}
        onInteractOutside={preventDialogDismissOnToast}
        onFocusOutside={preventDialogDismissOnToast}
        className="flex w-full max-w-[520px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[520px]"
      >
        <DialogTitle className="sr-only">Visualização do recibo</DialogTitle>

        <div className="relative flex shrink-0 items-center justify-center bg-[#E5E5E5] px-6 py-5 text-[#171717]">
          <h2 className="text-xl font-bold tracking-tight">
            Visualização do recibo
          </h2>
        </div>

        <div className="flex min-h-[min(58vh,520px)] flex-1 flex-col bg-[#F7F7F7] px-5 py-5">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            {isPdfReady ? (
              <iframe
                title={`Recibo ${receipt?.orderId ?? ''}`}
                src={pdfUrl ?? undefined}
                className="h-[min(54vh,480px)] w-full border-0 bg-white"
              />
            ) : (
              <div className="flex h-[min(54vh,480px)] items-center justify-center gap-2 text-sm text-[#737373]">
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Gerando PDF do recibo…
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#E5E5E5] bg-white px-5 py-4">
          <button
            type="button"
            className="pdv-gradient-border-btn flex h-11 min-w-[110px] items-center justify-center rounded-lg px-5 text-sm font-semibold text-[#171717]"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!pdfBlob}
            className="pdv-primary-gradient-btn flex h-11 min-w-[110px] items-center justify-center rounded-lg px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handlePrint}
          >
            Imprimir
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
