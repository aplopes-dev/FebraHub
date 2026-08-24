"use client";

import { Download } from "lucide-react";

import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@citybox/ui/atoms";

interface ExpenseReceiptViewerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptUrl: string | null;
  description: string;
}

/**
 * Visualizador de comprovante — versão mockada.
 *
 * No OdontoTech isto renderiza um PDFViewer da feature de pacientes. Aqui, com
 * dados 100% mockados, mostramos a imagem/URL do comprovante direto num `<img>`.
 */
export function ExpenseReceiptViewerSheet({
  open,
  onOpenChange,
  receiptUrl,
  description,
}: ExpenseReceiptViewerSheetProps) {
  const handleDownload = () => {
    if (!receiptUrl) return;
    const link = document.createElement("a");
    link.href = receiptUrl;
    link.target = "_blank";
    link.download = `comprovante-${description}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="w-full sm:max-w-full h-full flex flex-col p-0 gap-0"
      >
        <SheetTitle className="sr-only">Visualizar Comprovante</SheetTitle>
        <div className="flex flex-1 flex-col overflow-hidden bg-muted">
          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            {open && receiptUrl ? (
              <img
                src={receiptUrl}
                alt={`Comprovante de ${description}`}
                className="max-h-full max-w-full rounded-md object-contain shadow"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum comprovante disponível.
              </p>
            )}
          </div>
        </div>

        <SheetFooter className="flex-row gap-4 border-t pt-4 justify-end shrink-0 px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" onClick={handleDownload} disabled={!receiptUrl}>
            <Download className="mr-2 h-4 w-4" />
            Baixar Arquivo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
