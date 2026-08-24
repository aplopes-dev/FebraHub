import { ImageResponse } from "next/og";
import {
  BRAND_FAVICON_SIZE,
  BRAND_MARK_PATHS,
} from "@/lib/brand-favicon";

/** Favicon PNG gerado no request (App Router `icon.tsx` / `apple-icon.tsx`). */
export function generateBrandFavicon(primaryColor: string): ImageResponse {
  return new ImageResponse(
    (
      <svg
        width="143"
        height="143"
        viewBox="0 0 143 143"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="143" height="143" rx="34" fill={primaryColor} />
        {BRAND_MARK_PATHS.map((d) => (
          <path key={d} fillRule="evenodd" clipRule="evenodd" d={d} fill="white" />
        ))}
      </svg>
    ),
    { ...BRAND_FAVICON_SIZE },
  );
}
