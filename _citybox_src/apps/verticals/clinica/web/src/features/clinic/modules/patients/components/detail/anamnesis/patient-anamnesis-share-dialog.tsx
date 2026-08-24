'use client';

import { useCallback, useMemo } from 'react';
import { Copy, MessageCircle } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { toast } from 'sonner';
import {
  buildPatientAnamnesisPublicLink,
  buildPatientAnamnesisWhatsAppUrl,
  PATIENT_ANAMNESIS_LINK_EXPIRY_LABEL,
} from '../../../lib/build-patient-anamnesis-public-link';
import type { PatientAnamnesis } from '../../../types/patient-anamnesis';

type PatientAnamnesisShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anamnesis: PatientAnamnesis | null;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
};

export function PatientAnamnesisShareDialog({
  open,
  onOpenChange,
  anamnesis,
  patientName,
  patientEmail,
  patientPhone,
}: PatientAnamnesisShareDialogProps) {
  const publicLink = useMemo(() => {
    if (!anamnesis?.publicToken || typeof window === 'undefined') {
      return '';
    }

    return buildPatientAnamnesisPublicLink(window.location.origin, anamnesis.publicToken);
  }, [anamnesis?.publicToken, open]);

  const whatsAppUrl = useMemo(() => {
    if (!publicLink) {
      return null;
    }

    return buildPatientAnamnesisWhatsAppUrl(patientPhone, patientName, publicLink);
  }, [patientName, patientPhone, publicLink]);

  const handleCopyLink = useCallback(async () => {
    if (!publicLink) {
      return;
    }

    await navigator.clipboard.writeText(publicLink);
    toast.success('Link copiado.');
  }, [publicLink]);

  const handleWhatsApp = useCallback(() => {
    if (!whatsAppUrl) {
      toast.error('Telefone do paciente não informado.');
      return;
    }

    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
  }, [whatsAppUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-full max-w-lg flex-col gap-5 overflow-hidden sm:max-w-lg">
        <DialogHeader className="min-w-0 shrink-0 pr-8">
          <DialogTitle>Compartilhar anamnese</DialogTitle>
        </DialogHeader>

        <div className="min-w-0 space-y-5 overflow-hidden">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Paciente
            </p>
            <p className="truncate text-sm font-medium text-foreground">{patientName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {patientEmail || 'E-mail não informado'}
            </p>
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Link de preenchimento
            </p>
            <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-md border bg-muted/40 px-3 py-2.5">
              <span
                className="min-w-0 flex-1 truncate font-mono text-xs text-foreground sm:text-sm"
                title={publicLink || undefined}
              >
                {publicLink || 'Gerando link…'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                onClick={() => void handleCopyLink()}
                disabled={!publicLink}
              >
                <Copy className="size-4" aria-hidden />
                <span className="sr-only">Copiar link</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{PATIENT_ANAMNESIS_LINK_EXPIRY_LABEL}</p>
          </div>
        </div>

        <DialogFooter className="grid w-full min-w-0 shrink-0 grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-w-0"
            onClick={handleWhatsApp}
            disabled={!whatsAppUrl}
          >
            <MessageCircle className="mr-2 size-4 shrink-0" aria-hidden />
            <span className="truncate">WhatsApp</span>
          </Button>
          <Button type="button" className="min-w-0" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
