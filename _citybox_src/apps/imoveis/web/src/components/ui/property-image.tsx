'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import { Box } from '@citybox/mui/atoms';

type PropertyImageProps = {
  /** Define a variação de cor da ilustração (mock — substituir por foto real). */
  seed: string;
  alt: string;
  className?: string;
  sx?: SxProps<Theme>;
  /**
   * `cover` (padrão): preenche o container e pode cortar bordas (`slice`).
   * `contain`: mostra a ilustração inteira (`meet`).
   */
  fit?: 'cover' | 'contain';
};

const PALETTES = [
  { sky: '#cfe6f5', ground: '#b9c6cf', body: '#eef1f4', roof: '#2f3a42', accent: '#d97706' },
  { sky: '#d3ece6', ground: '#b6c8c3', body: '#f1f0ec', roof: '#26302f', accent: '#ea580c' },
  { sky: '#f2e3c9', ground: '#c7bda9', body: '#f4f2ee', roof: '#332d26', accent: '#b45309' },
  { sky: '#dcdff2', ground: '#bfc2d1', body: '#eeeef2', roof: '#2c2b38', accent: '#c2410c' },
] as const;

function paletteFor(seed: string) {
  const total = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PALETTES[total % PALETTES.length];
}

/**
 * Ilustração de imóvel usada no lugar das fotos enquanto o back-end não existe.
 * Trocar por `next/image` quando houver mídia real vinda da API.
 */
export function PropertyImage({
  seed,
  alt,
  className,
  sx,
  fit = 'cover',
}: PropertyImageProps) {
  const palette = paletteFor(seed);

  return (
    <Box
      component="svg"
      viewBox="0 0 320 200"
      role="img"
      aria-label={alt}
      preserveAspectRatio={fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}
      className={className}
      sx={[
        {
          width: '100%',
          height: '100%',
          display: 'block',
        },
        (theme) =>
          theme.palette.mode === 'dark'
            ? { filter: 'brightness(0.72) saturate(0.9)' }
            : {},
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <rect width="320" height="200" fill={palette.sky} />
      <circle cx="250" cy="46" r="20" fill="#ffffff" opacity="0.5" />
      <rect y="146" width="320" height="54" fill={palette.ground} />

      <rect x="92" y="108" width="136" height="42" fill={palette.body} />
      <rect x="86" y="101" width="148" height="9" rx="2" fill={palette.roof} />
      <rect x="102" y="118" width="52" height="24" rx="2" fill={palette.roof} opacity="0.55" />
      <rect x="162" y="118" width="22" height="24" rx="2" fill={palette.roof} opacity="0.35" />
      <rect x="190" y="118" width="24" height="24" rx="2" fill={palette.accent} opacity="0.7" />

      <rect x="114" y="66" width="94" height="38" fill={palette.body} opacity="0.95" />
      <rect x="108" y="59" width="106" height="8" rx="2" fill={palette.roof} />
      <rect x="126" y="76" width="46" height="20" rx="2" fill={palette.roof} opacity="0.45" />
      <rect x="180" y="76" width="18" height="20" rx="2" fill={palette.roof} opacity="0.3" />

      <circle cx="72" cy="142" r="17" fill="#2f6b4f" opacity="0.55" />
      <circle cx="248" cy="146" r="13" fill="#2f6b4f" opacity="0.45" />
    </Box>
  );
}
