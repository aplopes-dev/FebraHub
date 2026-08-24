'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, ExternalLink, MessageCircle, XCircle } from 'lucide-react';
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import {
  CLINIC_FLOATING_SHEET_CONTENT_CLASS,
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
  CLINIC_SHEET_BODY_PADDING_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import type { ElectronicSignature } from '../../../types/electronic-signature';
import {
  buildSignedPdfProxyUrl,
  cancelElectronicSignature,
} from '../../../services/electronic-signatures.service';

type SignatureRequestSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  signature: ElectronicSignature | null;
  onCancelled?: (signature: ElectronicSignature) => void;
};

export function SignatureRequestSheet({
  open,
  onOpenChange,
  storeId,
  signature,
  onCancelled,
}: SignatureRequestSheetProps) {
  const [cancelling, setCancelling] = useState(false);

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }

  async function handleCancel() {
    if (!signature) return;
    setCancelling(true);
    try {
      const updated = await cancelElectronicSignature(
        storeId,
        signature.patientId,
        signature.id,
      );
      toast.success('Solicitação cancelada');
      onCancelled?.(updated);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível cancelar a solicitação',
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          CLINIC_FLOATING_SHEET_CONTENT_CLASS,
          CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
        )}
      >
        <SheetHeader className={CLINIC_SHEET_HEADER_CLASS}>
          <SheetTitle>Assinatura eletrônica</SheetTitle>
        </SheetHeader>
        <div className={cn(CLINIC_SHEET_SCROLL_BODY_CLASS, CLINIC_SHEET_BODY_PADDING_CLASS)}>
          {!signature ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Status:{' '}
                <span className="font-medium text-foreground">
                  {signature.status === 'pending'
                    ? 'Pendente'
                    : signature.status === 'signed'
                      ? 'Assinado'
                      : signature.status}
                </span>
              </p>
              <div className="space-y-3">
                {signature.signers.map((signer) => (
                  <div
                    key={`${signer.role}-${signer.signUrl}`}
                    className="rounded-lg border border-border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {signer.role === 'patient'
                            ? 'Paciente / Responsável'
                            : 'Contratada'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {signer.name}
                          {signer.phone ? ` · ${signer.phone}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {signer.status}
                      </span>
                    </div>
                    {signer.signUrl ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleCopy(signer.signUrl)}
                        >
                          <Copy className="size-3.5" />
                          Copiar link
                        </Button>
                        {signer.whatsappUrl ? (
                          <Button type="button" variant="outline" size="sm" asChild>
                            <a
                              href={signer.whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="size-3.5" />
                              WhatsApp
                            </a>
                          </Button>
                        ) : null}
                        <Button type="button" variant="outline" size="sm" asChild>
                          <a href={signer.signUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-3.5" />
                            Abrir
                          </a>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {signature.hasSignedPdf ? (
                <Button type="button" variant="secondary" asChild>
                  <a
                    href={buildSignedPdfProxyUrl(
                      signature.patientId,
                      signature.id,
                      storeId,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Baixar PDF assinado
                  </a>
                </Button>
              ) : null}
            </div>
          )}
        </div>
        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          {signature?.status === 'pending' ? (
            <Button
              type="button"
              variant="destructive"
              className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
              disabled={cancelling}
              onClick={() => void handleCancel()}
            >
              <XCircle className="size-4" />
              Cancelar solicitação
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
