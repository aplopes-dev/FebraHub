'use client';

import { useState } from 'react';
import { Button, Switch } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { Panel } from '@/components/ui/panel';
import {
  usePutStoreNotificationsMutation,
  useStoreSettingsQuery,
} from '../hooks/use-settings-queries';
import type { StoreSettingsPayload } from '../services/settings-service';
import type { NotificationSettings } from '../types';

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
    </div>
  );
}

export function SettingsNotificationsPanel() {
  const { data, isPending, isError } = useStoreSettingsQuery();
  if (isError) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">Erro ao carregar.</p>
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
  return <NotificationsForm initial={data} />;
}

function NotificationsForm({ initial }: { initial: StoreSettingsPayload }) {
  const put = usePutStoreNotificationsMutation();
  const [form, setForm] = useState<NotificationSettings>(initial.notifications);

  function update<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function handleSave() {
    put.mutate(form, {
      onSuccess: (saved) => {
        setForm(saved.notifications);
        toast.success('Preferências salvas');
      },
      onError: () => toast.error('Não foi possível salvar'),
    });
  }

  return (
    <Panel className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Notificações</h2>
        <p className="text-sm text-muted-foreground">
          Canais e tipos de alerta.
        </p>
      </header>
      <section className="space-y-2">
        <ToggleRow
          title="E-mail"
          description="Avisos no e-mail cadastrado."
          checked={form.emailEnabled}
          onCheckedChange={(v) => update('emailEnabled', v)}
        />
        <ToggleRow
          title="Push"
          description="Notificações no navegador."
          checked={form.pushEnabled}
          onCheckedChange={(v) => update('pushEnabled', v)}
        />
        <ToggleRow
          title="Leads"
          description="Novos contatos e follow-ups."
          checked={form.leadsAlerts}
          onCheckedChange={(v) => update('leadsAlerts', v)}
        />
        <ToggleRow
          title="Agenda"
          description="Compromissos e lembretes."
          checked={form.calendarAlerts}
          onCheckedChange={(v) => update('calendarAlerts', v)}
        />
        <ToggleRow
          title="Documentos"
          description="Pendências em pastas."
          checked={form.documentsAlerts}
          onCheckedChange={(v) => update('documentsAlerts', v)}
        />
      </section>
      <div className="border-t border-border/60 pt-4">
        <Button
          variant="contained"
          className="h-11 rounded-3xl px-8"
          disabled={put.isPending}
          onClick={handleSave}
        >
          Salvar alterações
        </Button>
      </div>
    </Panel>
  );
}
