'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import type { WhatsappSession } from '../types/whatsapp';
import { WhatsappBrandIcon } from './whatsapp-brand-icon';

/** Baileys/WhatsApp Web renova o QR em ~60s. */
const QR_TTL_MS = 60_000;

type WhatsappQrDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: WhatsappSession | undefined;
  onRefreshQr: (options?: { silent?: boolean }) => void;
  isRefreshing: boolean;
};

function formatExpiresAt(updatedAt: string): string {
  const expires = new Date(new Date(updatedAt).getTime() + QR_TTL_MS);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(expires);
}

const STEPS = [
  'Abra o WhatsApp no seu celular',
  'Toque em Mais opções ou Configurações e selecione Aparelhos conectados',
  'Toque em Conectar um aparelho e aponte o celular para o código acima',
] as const;

export function WhatsappQrDialog({
  open,
  onOpenChange,
  session,
  onRefreshQr,
  isRefreshing,
}: WhatsappQrDialogProps) {
  const [, setTick] = useState(0);
  const autoRefreshedForUpdatedAt = useRef<string | null>(null);
  const onRefreshQrRef = useRef(onRefreshQr);
  onRefreshQrRef.current = onRefreshQr;

  useEffect(() => {
    if (!open || session?.status !== 'qr_pending') return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1_000);
    return () => window.clearInterval(id);
  }, [open, session?.status, session?.updatedAt]);

  useEffect(() => {
    if (!open || session?.status !== 'qr_pending' || !session.updatedAt) {
      return;
    }
    if (isRefreshing) return;

    const updatedAt = session.updatedAt;
    const expiresAt = new Date(updatedAt).getTime() + QR_TTL_MS;
    const remainingMs = expiresAt - Date.now();

    const refresh = () => {
      autoRefreshedForUpdatedAt.current = updatedAt;
      onRefreshQrRef.current({ silent: true });
    };

    if (remainingMs <= 0) {
      if (autoRefreshedForUpdatedAt.current === updatedAt) {
        const retry = window.setTimeout(refresh, 5_000);
        return () => window.clearTimeout(retry);
      }
      refresh();
      return;
    }

    autoRefreshedForUpdatedAt.current = null;
    const timer = window.setTimeout(refresh, remainingMs);
    return () => window.clearTimeout(timer);
  }, [open, session?.status, session?.updatedAt, isRefreshing]);

  const qrSrc =
    session?.qrBase64 && session.status === 'qr_pending'
      ? session.qrBase64.startsWith('data:')
        ? session.qrBase64
        : `data:image/png;base64,${session.qrBase64}`
      : null;

  const expiresLabel =
    session?.status === 'qr_pending' && session.updatedAt
      ? formatExpiresAt(session.updatedAt)
      : null;

  const isExpired =
    session?.status === 'qr_pending' &&
    session.updatedAt &&
    Date.now() > new Date(session.updatedAt).getTime() + QR_TTL_MS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[min(92dvh,52rem)] gap-5 overflow-y-auto sm:max-w-md',
        )}
      >
        <DialogHeader className="items-start pr-8 text-left sm:items-start sm:text-left">
            <div className="mb-1 flex items-center gap-3">
              <WhatsappBrandIcon className="size-7 text-foreground" />
              <DialogTitle className="text-xl">WhatsApp</DialogTitle>
            </div>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            Conecte sua conta do WhatsApp para habilitar funcionalidades de
            mensagens no sistema
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-5">
            <p className="text-sm font-medium">Escaneie o QR Code</p>

            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- QR dinâmico base64
              <img
                src={qrSrc}
                alt="QR Code WhatsApp"
                className={cn(
                  'size-64 rounded-xl bg-white p-3 sm:size-72',
                  isExpired && 'opacity-40',
                )}
              />
            ) : (
              <div className="flex min-h-64 w-full items-center justify-center sm:min-h-72">
                <p className="text-sm text-muted-foreground">
                  {session?.status === 'connected'
                    ? 'WhatsApp conectado com sucesso.'
                    : 'Aguardando QR Code…'}
                </p>
              </div>
            )}
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => onRefreshQr()}
            disabled={isRefreshing || session?.status === 'connected'}
          >
            <RefreshCw
              className={cn('size-4', isRefreshing && 'animate-spin')}
              aria-hidden
            />
            Atualizar QR
          </Button>

          {expiresLabel ? (
            <p
              className={cn(
                'text-muted-foreground text-xs',
                isExpired && 'text-destructive',
              )}
            >
              {isExpired ? 'Atualizando QR…' : `Expira em: ${expiresLabel}`}
            </p>
          ) : null}
        </div>

        {session?.lastError ? (
          <p className="text-center text-sm text-destructive">
            {session.lastError}
          </p>
        ) : null}

        <ol className="flex flex-col gap-3 border-t border-border/60 pt-5">
          {STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm">
              <span className="bg-primary/15 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {index + 1}
              </span>
              <span className="text-muted-foreground pt-1 leading-snug">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
