import { ImageResponse } from 'next/og';

export const VERTICAL_FAVICON_SIZE = { width: 143, height: 143 };

/**
 * Gera o favicon do símbolo Citybox com a cor de fundo da vertical.
 * Use em `icon.tsx` de cada segmento de vertical:
 *
 * ```tsx
 * export { VERTICAL_FAVICON_SIZE as size };
 * export const contentType = 'image/png';
 * export default function Icon() {
 *   return generateVerticalFavicon(FOOD_THEME.primaryColor);
 * }
 * ```
 */
export function generateVerticalFavicon(primaryColor: string): ImageResponse {
  return new ImageResponse(
    (
      <svg
        width="143"
        height="143"
        viewBox="0 0 143 143"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="143" height="143" rx="34" fill={primaryColor} />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M71.463 30.2278L108.045 44.3509L71.463 58.4776L34.8813 44.3509L71.463 30.2278Z"
          fill="white"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M34.8779 88.8172L68.1202 109.623V67.1577L53.1723 57.5152L34.8797 45.7175L34.8779 69.3155V88.8172Z"
          fill="white"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M108.049 88.8199L74.8052 109.623V67.1577L89.7531 57.5152L108.047 45.7175L108.049 69.3155V88.8199Z"
          fill="white"
        />
      </svg>
    ),
    { ...VERTICAL_FAVICON_SIZE },
  );
}
