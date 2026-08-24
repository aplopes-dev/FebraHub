import type { MetadataRoute } from 'next';

/**
 * Ícones do instalador / laucher:
 * - purpose "any" = PNG quadrado full-bleed (melhor no Linux desktop)
 * - purpose "maskable" = versão com cantos do logobrand (Android/adaptive)
 * - SVG por último: Chrome Linux usa PNG do .desktop; SVG sozinho costuma falhar na biblioteca de apps
 */
const ANY_SIZES = [48, 72, 96, 128, 192, 256, 512] as const;
const MASKABLE_SIZES = [192, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Citybox PDV',
    short_name: 'PDV',
    description:
      'Ponto de venda Citybox — food e varejo, instalável como app.',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#F7F7F7',
    theme_color: '#F7F7F7',
    lang: 'pt-BR',
    categories: ['business', 'productivity'],
    icons: [
      ...ANY_SIZES.map((size) => ({
        src: `/icons/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png' as const,
        purpose: 'any' as const,
      })),
      ...MASKABLE_SIZES.map((size) => ({
        src: `/icons/icon-maskable-${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png' as const,
        purpose: 'maskable' as const,
      })),
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
