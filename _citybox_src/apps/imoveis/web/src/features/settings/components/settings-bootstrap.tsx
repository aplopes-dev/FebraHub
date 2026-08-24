'use client';

import { usePathname } from 'next/navigation';
import { isUnauthenticatedPathname } from '@/lib/color-mode-shared';
import { useSettingsBootstrap } from '../hooks/use-settings-queries';
import { SessionAgentSync } from './session-agent-sync';

/**
 * Prefetch settings/equipe no shell autenticado.
 * Em `/agents/*` (catálogo público) não carrega — evita X-Store-Id e chamadas privadas.
 */
export function SettingsBootstrap() {
  const pathname = usePathname();
  const enabled = !isUnauthenticatedPathname(pathname);
  return enabled ? <SettingsBootstrapInner /> : null;
}

function SettingsBootstrapInner() {
  useSettingsBootstrap();
  return <SessionAgentSync />;
}
