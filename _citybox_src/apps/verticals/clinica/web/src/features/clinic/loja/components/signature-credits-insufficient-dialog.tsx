'use client';

import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { SIGNATURE_CREDITS_INSUFFICIENT_MESSAGE } from '../lib/signature-credits-insufficient';

type SignatureCreditsInsufficientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Aviso quando o usuário tenta assinar sem créditos na Loja. */
export function SignatureCreditsInsufficientDialog({
  open,
  onOpenChange,
}: SignatureCreditsInsufficientDialogProps) {
  const router = useRouter();

  function handleGoToLoja() {
    onOpenChange(false);
    router.push('/loja/assinatura-eletronica');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sem pacote de assinatura eletrônica</DialogTitle>
          <DialogDescription>
            {SIGNATURE_CREDITS_INSUFFICIENT_MESSAGE}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" onClick={handleGoToLoja}>
            Ir para a Loja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
