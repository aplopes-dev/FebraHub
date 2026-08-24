'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { Logo as CityboxLogo } from '@citybox/mui/molecules';

type LogoProps = {
  className?: string;
  sx?: SxProps<Theme>;
  /** Esconde o wordmark e deixa só o símbolo. */
  isIconOnly?: boolean;
};

/**
 * Marca Citybox (`packages/mui/src/logotipo.svg`).
 * Claro: tinta preta + símbolo branco no quadrado.
 * Escuro: tinta branca + símbolo preto no quadrado (contraste).
 */
export function Logo({ className, sx, isIconOnly = false }: LogoProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const brandColor = isDark
    ? theme.palette.common.white
    : theme.palette.common.black;
  const symbolColor = isDark
    ? theme.palette.common.black
    : theme.palette.common.white;

  return (
    <CityboxLogo
      variant={isIconOnly ? 'symbol' : 'full'}
      brandColor={brandColor}
      symbolColor={symbolColor}
      height={isIconOnly ? 40 : 32}
      title="Citybox"
      className={className}
      sx={[
        {
          flexShrink: 0,
          height: {
            xs: isIconOnly ? 36 : 28,
            sm: isIconOnly ? 40 : 32,
          },
          width: 'auto',
          maxWidth: '100%',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
}

/** Só o símbolo do logotipo (mesmo contraste claro/escuro). */
export function LogoMark({
  className,
  sx,
}: {
  className?: string;
  sx?: SxProps<Theme>;
}) {
  return <Logo className={className} sx={sx} isIconOnly />;
}
