'use client';

import { toast } from 'sonner';
import { CheckCircle2, Copy } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@citybox/ui/atoms';
import { WhatsappBrandIcon } from '@/features/clinic/modules/settings/whatsapp/components/whatsapp-brand-icon';
import type { ElectronicSignature } from '../../../types/electronic-signature';
import { buildSignedPdfProxyUrl } from '../../../services/electronic-signatures.service';

const SIGNATURE_PENDING_COLOR = 'text-[#9A7B0A]';
const SIGNATURE_SIGNED_GREEN = 'text-green-700';

type PatientSignatureIssuedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  signature: ElectronicSignature | null;
};

function formatSignedDay(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function buildSignerWhatsAppHref(signer: {
  name: string;
  signUrl: string;
  whatsappUrl: string | null;
}): string {
  if (signer.whatsappUrl) return signer.whatsappUrl;
  const text = `Olá${signer.name ? ` ${signer.name}` : ''}, acesse o link para assinar o documento: ${signer.signUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function PatientSignatureIssuedDialog({
  open,
  onOpenChange,
  storeId,
  signature,
}: PatientSignatureIssuedDialogProps) {
  const patientSigner =
    signature?.signers.find((signer) => signer.role === 'patient') ??
    signature?.signers[0] ??
    null;
  const isSigned =
    signature?.status === 'signed' || patientSigner?.status === 'signed';

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Documento emitido para assinar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-foreground">
            O documento foi emitido e enviado automaticamente para o e-mail do
            paciente/responsável. Para agilizar o processo de assinatura, você
            pode compartilhar o link abaixo por WhatsApp.
          </p>

          {patientSigner ? (
            <div
              className={cn(
                'flex flex-col gap-2 rounded-lg border p-3',
                isSigned
                  ? 'border-green-600/20 bg-green-50'
                  : 'border-border bg-background',
              )}
            >
              {isSigned ? (
                <div className="flex w-full items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-foreground">
                    Paciente/responsável:{' '}
                    <span className="font-bold">{patientSigner.name}</span>
                  </span>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 font-medium',
                      SIGNATURE_SIGNED_GREEN,
                    )}
                  >
                    <CheckCircle2
                      className="size-4 shrink-0 text-green-600"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    Assinou em{' '}
                    {formatSignedDay(
                      patientSigner.signedAt ??
                        signature?.completedAt ??
                        signature?.updatedAt ??
                        signature?.requestedAt ??
                        '',
                    )}
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Paciente/responsável
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {patientSigner.name}
                    </p>
                    <p className={`mt-0.5 text-xs ${SIGNATURE_PENDING_COLOR}`}>
                      Assinatura pendente
                    </p>
                  </div>
                  {patientSigner.signUrl ? (
                    <>
                      <Input
                        readOnly
                        value={patientSigner.signUrl}
                        className="h-9 text-xs"
                      />
                      <div className="mt-4 flex flex-wrap items-center justify-start gap-x-3 gap-y-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary"
                          onClick={() => void handleCopy(patientSigner.signUrl)}
                        >
                          <Copy className="size-3.5" />
                          Copiar link
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary"
                          asChild
                        >
                          <a
                            href={buildSignerWhatsAppHref(patientSigner)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <WhatsappBrandIcon className="size-3.5" />
                            Enviar por WhatsApp
                          </a>
                        </Button>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma solicitação de assinatura carregada.
            </p>
          )}

          {signature?.hasSignedPdf ? (
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
