'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Input,
  MenuItem,
  Select,
  Switch,
} from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { Panel } from '@/components/ui/panel';
import { useStore } from '@/lib/store-context';
import { AccentColorPicker } from './accent-color-picker';
import {
  type AccentColorValue,
} from '../data/accent-presets';
import {
  syncAccentColorFromApi,
  usePutStoreSettingsMutation,
  useStoreSettingsQuery,
} from '../hooks/use-settings-queries';
import { settingsKeys } from '../hooks/query-keys';
import { useSystemClock } from '../hooks/use-system-clock';
import type { StoreSettingsPayload } from '../services/settings-service';
import type { SystemSettings } from '../types';
import {
  SETTINGS_FIELD_SX,
  SETTINGS_SELECT_SX,
  SettingsField,
} from '../utils/settings-form-styles';

const TIMEZONE_OPTIONS = [
  { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
  { value: 'America/Manaus', label: 'Manaus (UTC-4)' },
  { value: 'America/Belem', label: 'Belém (UTC-3)' },
];

const CURRENCY_OPTIONS = [
  { value: 'BRL', label: 'Real (BRL)' },
  { value: 'USD', label: 'Dólar (USD)' },
];

const LANGUAGE_OPTIONS = [{ value: 'pt-BR', label: 'Português (Brasil)' }];

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

export function SettingsSystemPanel() {
  const { data, isPending, isError } = useStoreSettingsQuery();
  if (isError) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar as configurações.
        </p>
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
  return <SystemForm initial={data} />;
}

function SystemForm({ initial }: { initial: StoreSettingsPayload }) {
  const qc = useQueryClient();
  const { storeId } = useStore();
  const put = usePutStoreSettingsMutation();
  const [form, setForm] = useState<SystemSettings>(initial.system);
  const liveClock = useSystemClock(form.timezone);

  function cachedStore(): StoreSettingsPayload {
    if (!storeId) return initial;
    return qc.getQueryData(settingsKeys.store(storeId)) ?? initial;
  }

  function update<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function selectAccent(next: AccentColorValue) {
    const previous = form.accentColorId;
    setForm({ ...form, accentColorId: next });
    syncAccentColorFromApi(next);
    const base = cachedStore();
    put.mutate(
      { ...base, system: { ...base.system, accentColorId: next } },
      {
        onError: () => {
          setForm((c) => ({ ...c, accentColorId: previous }));
          syncAccentColorFromApi(previous);
          toast.error('Não foi possível salvar a cor de destaque');
        },
      },
    );
  }

  function handleSave() {
    if (!form.companyName.trim()) {
      toast.error('Informe o nome da imobiliária');
      return;
    }
    const base = cachedStore();
    put.mutate(
      {
        ...base,
        system: { ...form, companyName: form.companyName.trim() },
      },
      {
        onSuccess: (saved) => {
          setForm(saved.system);
          toast.success('Configurações de sistema salvas');
        },
        onError: () => toast.error('Não foi possível salvar'),
      },
    );
  }

  return (
    <Panel className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Configurações de sistema
        </h2>
        <p className="text-sm text-muted-foreground">
          Fuso, moeda e identidade da imobiliária.
        </p>
      </header>

      <SettingsField label="Nome da imobiliária" htmlFor="sys-company">
        <Input
          id="sys-company"
          value={form.companyName}
          onChange={(e) => update('companyName', e.target.value)}
          fullWidth
          sx={SETTINGS_FIELD_SX}
        />
      </SettingsField>

      <div className="grid gap-3 sm:grid-cols-2">
        <SettingsField label="Fuso horário" htmlFor="sys-tz">
          <Select
            id="sys-tz"
            value={form.timezone}
            onChange={(e) => update('timezone', e.target.value as string)}
            fullWidth
            sx={SETTINGS_SELECT_SX}
          >
            {TIMEZONE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </SettingsField>
        <SettingsField label="Relógio local">
          <Input value={liveClock} disabled fullWidth sx={SETTINGS_FIELD_SX} />
        </SettingsField>
        <SettingsField label="Moeda" htmlFor="sys-currency">
          <Select
            id="sys-currency"
            value={form.currency}
            onChange={(e) => update('currency', e.target.value as string)}
            fullWidth
            sx={SETTINGS_SELECT_SX}
          >
            {CURRENCY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </SettingsField>
        <SettingsField label="Idioma" htmlFor="sys-lang">
          <Select
            id="sys-lang"
            value={form.language}
            onChange={(e) => update('language', e.target.value as string)}
            fullWidth
            sx={SETTINGS_SELECT_SX}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </SettingsField>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Cor de destaque</h3>
        <p className="text-xs text-muted-foreground">
          Escolha um preset ou qualquer cor no espectro (hex).
        </p>
        <AccentColorPicker value={form.accentColorId} onChange={selectAccent} />
      </section>

      <section className="space-y-2">
        <ToggleRow
          title="Atribuição automática de leads"
          description="Distribui novos leads entre corretores ativos."
          checked={form.autoAssignLeads}
          onCheckedChange={(v) => update('autoAssignLeads', v)}
        />
        <ToggleRow
          title="2FA obrigatório para novos usuários"
          description="Exige autenticação em duas etapas no primeiro acesso."
          checked={form.requireTwoFactorForNewUsers}
          onCheckedChange={(v) => update('requireTwoFactorForNewUsers', v)}
        />
        <ToggleRow
          title="Botão de WhatsApp na página do imóvel"
          description="Exibe o botão de contato via WhatsApp na página pública do imóvel (barra no mobile e FAB no desktop)."
          checked={form.whatsappCatalogEnabled}
          onCheckedChange={(v) => update('whatsappCatalogEnabled', v)}
        />
        <ToggleRow
          title="Formulário de lead na página do imóvel"
          description="Exibe o formulário de captação de interesse na página pública do imóvel (catálogo e link curto)."
          checked={form.leadFormCatalogEnabled}
          onCheckedChange={(v) => update('leadFormCatalogEnabled', v)}
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
