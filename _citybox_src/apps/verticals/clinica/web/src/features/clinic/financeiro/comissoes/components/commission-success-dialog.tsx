'use client';

import { CheckCircle2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';

function formatBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  );
}

type CommissionSuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalName: string;
  paidValueCents: number;
};

export function CommissionSuccessDialog({
  open,
  onOpenChange,
  professionalName,
  paidValueCents,
}: CommissionSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <CheckCircle2 className="size-14 text-green-500" aria-hidden />

          <DialogHeader className="space-y-1 text-center sm:text-center">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Comissão paga com sucesso!
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Este valor irá aparecer no seu financeiro como:
            </p>
            <p className="text-sm font-medium text-foreground">
              Comissão {professionalName} no valor de{' '}
              <span className="font-bold text-green-700">{formatBrl(paidValueCents)}</span>
            </p>
          </DialogHeader>
        </div>

        <DialogFooter className="justify-center">
          <Button
            type="button"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
