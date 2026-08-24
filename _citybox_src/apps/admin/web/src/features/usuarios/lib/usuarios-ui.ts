/** Classes compartilhadas — cards flat, sem sombra (padrão admin Orbitly). */
export const DASHBOARD_CARD =
  "overflow-hidden rounded-2xl border border-border/50 bg-card shadow-none ring-0 [--card-spacing:--spacing(5)]";

export const DASHBOARD_CARD_INNER =
  "overflow-hidden rounded-xl border border-border/40 bg-background/60 shadow-none ring-0";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
