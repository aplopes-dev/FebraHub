import type { VerticalTheme } from '@/lib/vertical/types';

const PRIMARY_VAR = '--primary';
const PRIMARY_FOREGROUND_VAR = '--primary-foreground';
const PRIMARY_DARK_VAR = '--primary-dark';

export function applyVerticalTheme(verticalId: string, theme: VerticalTheme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.dataset.vertical = verticalId;
  root.style.setProperty(PRIMARY_VAR, `hsl(${theme.primaryHsl})`);
  root.style.setProperty(PRIMARY_FOREGROUND_VAR, `hsl(${theme.primaryForegroundHsl})`);

  if (theme.primaryDarkHsl) {
    root.style.setProperty(PRIMARY_DARK_VAR, `hsl(${theme.primaryDarkHsl})`);
  }
}

export function clearVerticalTheme() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  delete root.dataset.vertical;
  root.style.removeProperty(PRIMARY_VAR);
  root.style.removeProperty(PRIMARY_FOREGROUND_VAR);
  root.style.removeProperty(PRIMARY_DARK_VAR);
}
