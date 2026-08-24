'use client';

import { resolveClinicSettingsTabIcon } from '@/features/clinic/lib/icons';

const SETTINGS_TAB_IDS: Record<string, string> = {
  Equipe: 'equipe',
  Planos: 'planos',
  Anamneses: 'anamneses',
  Contrato: 'contrato',
};

/** Conteúdo placeholder genérico para as abas de Configurações da clínica. */
export function ClinicSettingsPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const tabId = SETTINGS_TAB_IDS[title] ?? 'clinica';
  const Icon = resolveClinicSettingsTabIcon(tabId);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-base font-medium text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
