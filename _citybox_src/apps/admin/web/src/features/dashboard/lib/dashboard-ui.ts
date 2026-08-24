/** Classes compartilhadas — cards flat Orbitly (padrão admin). */
export const DASHBOARD_CARD =
  "overflow-hidden rounded-2xl border border-border/50 bg-card shadow-none ring-0";

export const DASHBOARD_CARD_INNER =
  "overflow-hidden rounded-xl border border-border/40 bg-background/60 shadow-none ring-0";

export const CHART_COLORS = {
  lime: "var(--orbitly-lime)",
  teal: "var(--orbitly-teal)",
  ink: "var(--orbitly-ink)",
  sand: "var(--orbitly-sand)",
  limeSoft: "color-mix(in oklch, var(--orbitly-lime) 55%, white)",
  tealSoft: "color-mix(in oklch, var(--orbitly-teal) 45%, white)",
  inkMuted: "color-mix(in oklch, var(--orbitly-ink) 25%, white)",
} as const;
