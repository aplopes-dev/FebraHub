'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Copy, ExternalLink, Users } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Input,
} from '@citybox/ui/atoms';
import { WhatsappBrandIcon } from '@/features/clinic/modules/settings/whatsapp/components/whatsapp-brand-icon';
import type { ElectronicSignature } from '../../../../types/electronic-signature';
import {
  buildSignedPdfProxyUrl,
  cancelElectronicSignature,
} from '../../../../services/electronic-signatures.service';

const SIGNATURE_PENDING_COLOR = 'text-[#9A7B0A]';
const SIGNATURE_PENDING_BADGE_CLASS =
  'border-[#9A7B0A]/25 bg-[#9A7B0A]/15 text-[#9A7B0A]';
const SIGNATURE_SIGNED_GREEN = 'text-green-700';
const SIGNATURE_SIGNED_BADGE_CLASS =
  'border-green-600/20 bg-green-50 text-green-700';

type ContractSignatoriesAccordionProps = {
  storeId: string;
  signature: ElectronicSignature;
  clinicName: string;
  patientName: string;
  onCancelled?: () => void;
};

function signerRoleLabel(role: string): string {
  return role === 'responsible' ? 'Clínica' : 'Paciente/responsável';
}

function signerStatusLabel(status: string): string {
  if (status === 'signed') return 'Assinado';
  return 'Assinatura pendente';
}

function formatSignedDay(isoDate: string): string {
  const date = new Date(isoDate);
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

export function ContractSignatoriesAccordion({
  storeId,
  signature,
  clinicName,
  patientName,
  onCancelled,
}: ContractSignatoriesAccordionProps) {
  const [cancelling, setCancelling] = useState(false);
  const signedCount = signature.signers.filter((s) => s.status === 'signed').length;
  const total = Math.max(signature.signers.length, 2);
  const allSigned = signedCount >= total && signature.signers.every((s) => s.status === 'signed');
  const orderedSigners = [...signature.signers].sort((a, b) => {
    if (a.role === 'responsible') return -1;
    if (b.role === 'responsible') return 1;
    return 0;
  });

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelElectronicSignature(storeId, signature.patientId, signature.id);
      toast.success('Solicitação cancelada');
      onCancelled?.();
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
    <Accordion
      type="single"
      collapsible
      defaultValue="signatories"
      className="w-full overflow-hidden rounded-lg border border-border bg-background"
    >
      <AccordionItem value="signatories" className="border-0 data-[state=open]:bg-transparent">
        <AccordionTrigger className="items-center gap-2 px-4 py-3 hover:no-underline **:data-[slot=accordion-trigger-icon]:ml-0">
          <div className="min-w-0 flex-1 space-y-1 text-left">
            <div className="flex items-center gap-2">
              <Users className="size-4 shrink-0 text-foreground" aria-hidden />
              <span className="text-base font-bold text-foreground">Signatários:</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-base text-muted-foreground">
                {clinicName || '—'}
                <span className="mx-1.5" aria-hidden>
                  |
                </span>
                {patientName || '—'}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 text-xs font-medium group-aria-expanded/accordion-trigger:hidden',
                  allSigned ? SIGNATURE_SIGNED_BADGE_CLASS : SIGNATURE_PENDING_BADGE_CLASS,
                )}
              >
                {signedCount}/{total} assinaturas
              </Badge>
            </div>
          </div>
          <span className="shrink-0 text-sm font-medium text-primary">Ver detalhes</span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3 [&_a]:no-underline [&_p]:mb-0">
          <div className="space-y-3 border-t border-border pt-3">
            <p
              className={cn(
                'text-base font-medium',
                allSigned ? SIGNATURE_SIGNED_GREEN : SIGNATURE_PENDING_COLOR,
              )}
            >
              {signedCount}/{total} assinaturas
            </p>
            {allSigned ? (
              <p className="text-sm text-foreground">
                O documento foi <span className="font-bold">assinado</span> por
                ambas as partes!
              </p>
            ) : (
              <p className="text-sm text-foreground">
                O documento foi emitido e enviado por e-mail aos signatários. No
                entanto, você também pode enviar o link por WhatsApp.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {orderedSigners.map((signer) => {
                const isClinic = signer.role === 'responsible';
                const isSigned = signer.status === 'signed';
                const signedAt =
                  signer.signedAt ??
                  signature.completedAt ??
                  signature.updatedAt ??
                  signature.requestedAt;

                return (
                  <div
                    key={`${signer.role}-${signer.signUrl || signer.name}`}
                    className={cn(
                      'flex flex-col gap-2 rounded-lg border p-3',
                      isSigned
                        ? 'border-green-600/20 bg-green-50 py-5'
                        : 'border-border bg-background',
                    )}
                  >
                    {isSigned ? (
                      <div className="flex w-full items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-foreground">
                          {signerRoleLabel(signer.role)}:{' '}
                          <span className="font-bold">{signer.name}</span>
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
                          Assinou em {formatSignedDay(signedAt)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {signerRoleLabel(signer.role)}
                          </p>
                          <p className="text-sm font-bold text-foreground">{signer.name}</p>
                          <p className={`mt-0.5 text-xs ${SIGNATURE_PENDING_COLOR}`}>
                            {signerStatusLabel(signer.status)}
                          </p>
                        </div>
                        {signer.signUrl ? (
                          <>
                            <Input readOnly value={signer.signUrl} className="h-9 text-xs" />
                            <div className="mt-3 flex flex-wrap items-center justify-start gap-x-3 gap-y-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary"
                                onClick={() => void handleCopy(signer.signUrl)}
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
                                  href={buildSignerWhatsAppHref(signer)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <WhatsappBrandIcon className="size-3.5" />
                                  Enviar por WhatsApp
                                </a>
                              </Button>
                              {isClinic ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary"
                                  asChild
                                >
                                  <a href={signer.signUrl} target="_blank" rel="noreferrer">
                                    <ExternalLink className="size-3.5" />
                                    Assinar agora
                                  </a>
                                </Button>
                              ) : null}
                            </div>
                          </>
                        ) : null}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {signature.status === 'pending' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-0 text-destructive hover:bg-transparent hover:text-destructive"
                  disabled={cancelling}
                  onClick={() => void handleCancel()}
                >
                  Cancelar solicitação
                </Button>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary"
                asChild
              >
                <a
                  href={buildSignedPdfProxyUrl(
                    signature.patientId,
                    signature.id,
                    storeId,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Baixar documento
                </a>
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
