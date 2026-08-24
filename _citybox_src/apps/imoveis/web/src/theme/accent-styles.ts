import type { Theme } from '@mui/material/styles';
import { listifyElevatedSurface } from './listify-field-styles';
import { listifyShadows } from './tokens/shadows';

/**
 * Estilos derivados do `palette.primary` (accent dinâmico).
 * Use sempre estes helpers em vez de hex/rgba do laranja Listify.
 */

/** Sombra suave de pill/toggle selecionado — desativada (flat). */
export function primarySoftShadow(_theme: Theme, _intensity = 0.25): string {
  return listifyShadows.none;
}

/** Sombra de botão contained primary / CTA — desativada (flat). */
export function primaryButtonShadow(_theme: Theme): string {
  return listifyShadows.none;
}

/** Glow circular (avatar / botão IA) — desativado (flat). */
export function primaryGlowShadow(_theme: Theme, _intensity = 0.5): string {
  return listifyShadows.none;
}

/** Gradiente vertical light → main (botão IA, badge “recomendado”). */
export function primaryVerticalGradient(theme: Theme): string {
  return `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`;
}

/** Gradiente horizontal (barra de progresso / deals). */
export function primaryHorizontalGradient(theme: Theme): string {
  const { light, main, dark } = theme.palette.primary;
  return `linear-gradient(90deg, ${main} 0%, ${dark} 50%, ${light} 100%)`;
}

/**
 * Superfície cream dos popovers Listify (agenda / contato).
 * Equivale ao Primary/0 do guide, tingida pelo accent ativo.
 * Usa `color-mix` (opaco) — não `alpha` sobre paper transparente.
 */
export function primarySoftSurface(theme: Theme, intensity = 0.08): string {
  const pct = Math.round(Math.min(1, Math.max(0, intensity)) * 100);
  const base =
    theme.palette.mode === 'dark'
      ? listifyElevatedSurface(theme)
      : theme.palette.common.white;
  return `color-mix(in srgb, ${theme.palette.primary.main} ${pct}%, ${base})`;
}

/** Superfície cream/warning (seleção de corretor, ícones de nota). */
export function warningSoftSurface(theme: Theme, intensity = 0.08): string {
  const pct = Math.round(Math.min(1, Math.max(0, intensity)) * 100);
  const base =
    theme.palette.mode === 'dark'
      ? listifyElevatedSurface(theme)
      : theme.palette.common.white;
  return `color-mix(in srgb, ${theme.palette.warning.main} ${pct}%, ${base})`;
}

/** Painel glass compacto (card IA na sidebar de lead). */
export function listifyGlassPanelSx(theme: Theme) {
  return {
    border:
      theme.palette.mode === 'dark'
        ? '1px solid rgba(255, 255, 255, 0.08)'
        : '1px solid rgba(255, 255, 255, 0.12)',
    bgcolor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(7.5px)',
  } as const;
}

/** Paper padrão dos popovers Listify (radius 24 + cream accent). */
export function listifyPopoverPaperSx(
  theme: Theme,
  extras?: Record<string, unknown>,
) {
  return {
    borderRadius: '24px',
    border: 0,
    bgcolor: primarySoftSurface(theme),
    boxShadow: listifyShadows.md,
    overflow: 'hidden',
    ...extras,
  };
}
