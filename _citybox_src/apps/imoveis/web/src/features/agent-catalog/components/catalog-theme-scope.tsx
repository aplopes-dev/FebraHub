'use client';

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { CityboxMuiProvider, createAppTheme } from '@citybox/mui/theme';
import {
  imoveisDarkPaletteOverrides,
  imoveisMuiThemeOptions,
} from '@/theme/imoveis-mui-theme';
import { imoveisSemanticPaletteDark } from '@/theme/semantic-palette';
import { resolveAccentPalette } from '@/theme/accent-color';
import { parseAccentColorId } from '@/features/settings/data/accent-presets';

type CatalogThemeScopeProps = {
  children: ReactNode;
  accentColorId?: string;
};

type CatalogCssVars = CSSProperties & Record<`--${string}`, string>;

/**
 * Escopo visual exclusivo das rotas públicas do catálogo.
 * Replica o accent escolhido nas Configurações do sistema da loja.
 */
export function CatalogThemeScope({
  children,
  accentColorId,
}: CatalogThemeScopeProps) {
  const parentTheme = useMuiTheme();
  const mode = parentTheme.palette.mode === 'dark' ? 'dark' : 'light';
  const accent = parseAccentColorId(accentColorId);

  const catalogTheme = useMemo(
    () => {
      const primary = resolveAccentPalette(accent, mode);
      return createAppTheme(imoveisMuiThemeOptions, {
        palette: {
          mode,
          primary,
          ...(mode === 'dark'
            ? {
                ...imoveisDarkPaletteOverrides,
                ...imoveisSemanticPaletteDark,
              }
            : {}),
        },
      });
    },
    [accent, mode],
  );

  const cssVars = useMemo<CatalogCssVars>(() => {
    const { primary, background } = catalogTheme.palette;
    const softBase = mode === 'dark' ? background.default : 'white';
    const softIntensity = mode === 'dark' ? 28 : 14;
    return {
      ['--primary']: primary.main,
      ['--primary-foreground']: primary.contrastText,
      ['--primary-soft']:
        `color-mix(in srgb, ${primary.main} ${softIntensity}%, ${softBase})`,
      ['--primary-soft-foreground']: primary.main,
      ['--ring']: primary.main,
    };
  }, [catalogTheme, mode]);

  return (
    <div data-catalog-theme="system-accent" style={cssVars}>
      <CityboxMuiProvider theme={catalogTheme} withCssBaseline={false}>
        {children}
      </CityboxMuiProvider>
    </div>
  );
}
