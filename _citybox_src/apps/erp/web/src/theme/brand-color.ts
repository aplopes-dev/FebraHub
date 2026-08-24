/**
 * Cor de marca do ERP Comércio.
 *
 * Usada no tema MUI (`primary`) e no favicon. Pode ser sobrescrita em runtime
 * via `localStorage.company_brand_color` / evento `brand-color-changed`.
 */
/** Primária dos presets MUI (`comercio-theme-v1` / `v2`). */
export const DEFAULT_BRAND_COLOR = "#3F43BF";

export const BRAND_COLOR_PALETTES: Record<
  string,
  { main: string; light: string; dark: string }
> = {
  "#3F43BF": { main: "#3F43BF", light: "#7376D2", dark: "#2B2E86" },
  "#2563EB": { main: "#2563EB", light: "#60A5FA", dark: "#1E40AF" },
  "#0EA5E9": { main: "#0EA5E9", light: "#38BDF8", dark: "#0369A1" },
  "#4F46E5": { main: "#4F46E5", light: "#818CF8", dark: "#3730A3" },
  "#9333EA": { main: "#9333EA", light: "#C084FC", dark: "#6B21A8" },
  "#7C3AED": { main: "#7C3AED", light: "#A78BFA", dark: "#5B21B6" },
  "#DB2777": { main: "#DB2777", light: "#F472B6", dark: "#9D174D" },
  "#DC2626": { main: "#DC2626", light: "#F87171", dark: "#991B1B" },
  "#EA580C": { main: "#EA580C", light: "#FB923C", dark: "#9A3412" },
  "#D97706": { main: "#D97706", light: "#FBBF24", dark: "#92400E" },
  "#16A34A": { main: "#16A34A", light: "#4ADE80", dark: "#166534" },
  "#059669": { main: "#059669", light: "#34D399", dark: "#065F46" },
  "#0D9488": { main: "#0D9488", light: "#2DD4BF", dark: "#115E59" },
  "#475569": { main: "#475569", light: "#94A3B8", dark: "#1E293B" },
  "#6B7280": { main: "#6B7280", light: "#9CA3AF", dark: "#374151" },
  "#52525B": { main: "#52525B", light: "#A1A1AA", dark: "#27272A" },
  "#525252": { main: "#525252", light: "#A3A3A3", dark: "#262626" },
  "#57534E": { main: "#57534E", light: "#A8A29E", dark: "#292524" },
  "#374151": { main: "#374151", light: "#6B7280", dark: "#1F2937" },
};

export function resolveBrandPalette(brandColor: string): {
  main: string;
  light: string;
  dark: string;
} {
  return (
    BRAND_COLOR_PALETTES[brandColor.toUpperCase()] ?? {
      main: brandColor,
      light: brandColor,
      dark: brandColor,
    }
  );
}
