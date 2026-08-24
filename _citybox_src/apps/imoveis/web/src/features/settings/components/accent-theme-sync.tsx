'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { useTheme } from '@/lib/color-mode';
import {
  applyAccentColor,
  DEFAULT_ACCENT_COLOR_ID,
  parseAccentColorId,
  type AccentColorValue,
} from '../data/accent-presets';
import {
  getSettingsVersion,
  getSystemFromStore,
  isSettingsHydratedFromStorage,
  subscribeSettings,
} from '../data/settings-store';

type AccentThemeSyncProps = {
  /** Accent do cookie SSR — usado até o store hidratar. */
  initialAccentColorId?: AccentColorValue;
};

/**
 * Snapshot primitivo (`hydrated|accent|version`) — evita loop do useSyncExternalStore.
 */
function getAccentSyncSnapshot(initial: AccentColorValue): string {
  if (typeof window === 'undefined' || !isSettingsHydratedFromStorage()) {
    return `0|${initial}|0`;
  }
  const accent = getSystemFromStore().accentColorId;
  return `1|${accent}|${getSettingsVersion()}`;
}

/**
 * Mantém `data-accent` no `<html>` alinhado ao accent ativo.
 * Usa o cookie/SSR até hidratar — não aplica seed laranja no primeiro paint.
 */
export function AccentThemeSync({
  initialAccentColorId = DEFAULT_ACCENT_COLOR_ID,
}: AccentThemeSyncProps) {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const snapshot = useSyncExternalStore(
    subscribeSettings,
    () => getAccentSyncSnapshot(initialAccentColorId),
    () => `0|${initialAccentColorId}|0`,
  );
  const [hydratedFlag, accentRaw] = snapshot.split('|');
  const hydrated = hydratedFlag === '1';
  const activeAccent = hydrated
    ? parseAccentColorId(accentRaw)
    : parseAccentColorId(initialAccentColorId);

  useLayoutEffect(() => {
    applyAccentColor(activeAccent, mode);
  }, [activeAccent, hydrated, mode]);

  return null;
}
