'use client';

import { Loader2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';

type PatientCancelSignatureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCancelling?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * Confirmação genérica de cancelamento de solicitação de assinatura
 * (anamnese, contrato, evolução).
 */
export function PatientCancelSignatureDialog({
  open,
  onOpenChange,
  isCancelling = false,
  onConfirm,
}: PatientCancelSignatureDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isCancelling) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader className="gap-4">
          <DialogTitle className="text-destructive">
            Cancelar solicitação de assinatura
          </DialogTitle>
          <DialogDescription asChild className="text-foreground">
            <div className="space-y-2 text-left text-sm !text-foreground">
              <p className="text-foreground">
                Ao cancelar a solicitação de assinatura:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-foreground">
                <li>O documento retornará para o status sem assinatura;</li>
                <li>O documento enviado para o paciente será cancelado.</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isCancelling}
            onClick={() => handleOpenChange(false)}
          >
            Fechar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isCancelling}
            onClick={() => void onConfirm()}
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Cancelando…
              </>
            ) : (
              'Cancelar Solicitação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
