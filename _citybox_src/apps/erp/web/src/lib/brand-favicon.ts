/**
 * Símbolo Citybox (`packages/mui/src/logobrand.svg`) — helpers client-safe.
 * A geração PNG (`next/og`) fica em `generate-brand-favicon.tsx` (só server).
 */

export const BRAND_FAVICON_SIZE = { width: 143, height: 143 } as const;

export const BRAND_MARK_PATHS = [
  "M71.463 30.2278L108.045 44.3509L71.463 58.4776L34.8813 44.3509L71.463 30.2278Z",
  "M34.8779 88.8172L68.1202 109.623V67.1577L53.1723 57.5152L34.8797 45.7175L34.8779 69.3155V88.8172Z",
  "M108.049 88.8199L74.8052 109.623V67.1577L89.7531 57.5152L108.047 45.7175L108.049 69.3155V88.8199Z",
] as const;

/** SVG do favicon (client: `data:` URI quando a marca muda). */
export function buildBrandFaviconSvg(backgroundColor: string): string {
  const paths = BRAND_MARK_PATHS.map(
    (d) =>
      `<path fill-rule="evenodd" clip-rule="evenodd" d="${d}" fill="white"/>`,
  ).join("");
  return `<svg width="143" height="143" viewBox="0 0 143 143" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="143" height="143" rx="34" fill="${backgroundColor}"/>${paths}</svg>`;
}

export function brandFaviconDataUri(backgroundColor: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    buildBrandFaviconSvg(backgroundColor),
  )}`;
}
