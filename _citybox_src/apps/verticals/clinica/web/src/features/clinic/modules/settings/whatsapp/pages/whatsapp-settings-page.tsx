'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge, Button } from '@citybox/ui/atoms';
import { ConfirmDialog } from '@citybox/ui/organisms';
import { WhatsappBrandIcon } from '../components/whatsapp-brand-icon';
import { WhatsappQrDialog } from '../components/whatsapp-qr-dialog';
import { WhatsappTemplatesSection } from '../components/whatsapp-templates-section';
import {
  useWhatsappMutations,
  useWhatsappSessionQuery,
  useWhatsappTemplatesQuery,
} from '../hooks/use-whatsapp-queries';
import { WHATSAPP_STATUS_LABEL } from '../types/whatsapp';

function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'connected') return 'outline';
  if (status === 'error') return 'destructive';
  if (status === 'qr_pending') return 'secondary';
  return 'outline';
}

function statusBadgeClassName(status: string): string | undefined {
  if (status === 'connected') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  }
  return undefined;
}

/** Aba Configurações → WhatsApp. */
export function WhatsappSettingsContent() {
  const sessionQuery = useWhatsappSessionQuery();
  const templatesQuery = useWhatsappTemplatesQuery();
  const { requestQr, disconnect, saveTemplate } = useWhatsappMutations();
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const session = sessionQuery.data;

  useEffect(() => {
    if (session?.status === 'connected' && qrOpen) {
      setQrOpen(false);
    }
  }, [session?.status, qrOpen]);

  const handleGenerateQr = () => {
    setQrOpen(true);
    // `mutate({ silent: false })` e não `mutate()`: as variáveis da mutation são um objeto
    // opcional, e o TanStack Query exige o argumento mesmo assim. Explicitar também deixa
    // claro que este caminho é o clique do operador — o refresh automático manda `silent`.
    requestQr.mutate({ silent: false });
  };

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-xl border border-border/60 bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <WhatsappBrandIcon className="size-8 text-foreground" />
              <h2 className="text-3xl font-bold text-foreground">WhatsApp</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Conecte o número da clínica para envio automático de confirmações.
            </p>
          </div>
          {sessionQuery.isLoading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : session ? (
            <Badge
              variant={statusBadgeVariant(session.status)}
              className={statusBadgeClassName(session.status)}
            >
              {WHATSAPP_STATUS_LABEL[session.status]}
            </Badge>
          ) : null}
        </div>

        {session?.phoneE164 ? (
          <p className="text-sm text-foreground">
            Número conectado:{' '}
            <span className="font-medium">{session.phoneE164}</span>
          </p>
        ) : null}

        {session?.lastError && session.status === 'error' ? (
          <p className="text-sm text-destructive">{session.lastError}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {session?.status === 'connected' ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmDisconnect(true)}
              disabled={disconnect.isPending}
            >
              Excluir conexão
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleGenerateQr}
              disabled={requestQr.isPending}
            >
              Gerar QR Code
            </Button>
          )}
        </div>
      </section>

      <WhatsappTemplatesSection
        templates={templatesQuery.data}
        isLoading={templatesQuery.isLoading}
        isSaving={saveTemplate.isPending}
        onSave={async (item) => {
          await saveTemplate.mutateAsync(item);
        }}
      />

      <WhatsappQrDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        session={session}
        onRefreshQr={(options) => requestQr.mutate(options)}
        isRefreshing={requestQr.isPending}
      />

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Desconectar WhatsApp?"
        description="A clínica precisará escanear um novo QR Code para voltar a enviar mensagens."
        confirmLabel="Desconectar"
        confirmVariant="destructive"
        onConfirm={() => {
          disconnect.mutate(undefined, {
            onSuccess: () => setConfirmDisconnect(false),
          });
        }}
        isConfirming={disconnect.isPending}
      />
    </div>
  );
}
