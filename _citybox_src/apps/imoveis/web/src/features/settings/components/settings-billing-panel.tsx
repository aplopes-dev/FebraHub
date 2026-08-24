'use client';

import clsx from 'clsx';
import { Badge } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { useBillingQuery } from '../hooks/use-settings-queries';

const STATUS_LABEL = {
  active: 'Ativo',
  past_due: 'Em atraso',
  canceled: 'Cancelado',
} as const;

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function SettingsBillingPanel() {
  const { data, isPending, isError } = useBillingQuery();

  if (isError) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">Erro ao carregar cobrança.</p>
      </Panel>
    );
  }

  if (isPending || !data) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </Panel>
    );
  }

  return (
    <Panel className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Assinatura e cobrança</h2>
        <p className="text-sm text-muted-foreground">Plano atual e próxima renovação.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 px-4 py-4">
          <p className="text-xs text-muted-foreground">Plano</p>
          <p className="text-lg font-semibold">{data.planName}</p>
        </div>
        <div className="rounded-2xl border border-border/60 px-4 py-4">
          <p className="text-xs text-muted-foreground">Valor</p>
          <p className="text-lg font-semibold">{formatMoney(data.amountCents)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 px-4 py-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge
            size="small"
            className={clsx(
              'mt-1 rounded-full',
              data.status === 'active'
                ? 'bg-success-soft text-success'
                : data.status === 'past_due'
                  ? 'bg-warning-soft text-warning'
                  : 'bg-muted text-muted-foreground',
            )}
            label={STATUS_LABEL[data.status]}
          />
        </div>
        <div className="rounded-2xl border border-border/60 px-4 py-4">
          <p className="text-xs text-muted-foreground">Renovação</p>
          <p className="text-lg font-semibold">
            {data.renewsAt
              ? new Intl.DateTimeFormat('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(data.renewsAt))
              : '—'}
          </p>
        </div>
      </div>
    </Panel>
  );
}
