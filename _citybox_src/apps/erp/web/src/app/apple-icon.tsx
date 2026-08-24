import { DEFAULT_BRAND_COLOR } from "@/theme/brand-color";
import { BRAND_FAVICON_SIZE } from "@/lib/brand-favicon";
import { generateBrandFavicon } from "@/lib/generate-brand-favicon";

export const size = BRAND_FAVICON_SIZE;
export const contentType = "image/png";

export default function AppleIcon() {
  return generateBrandFavicon(DEFAULT_BRAND_COLOR);
}
