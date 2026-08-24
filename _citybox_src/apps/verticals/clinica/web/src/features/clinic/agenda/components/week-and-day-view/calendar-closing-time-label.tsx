const CLOSING_FOOTER_MIN_HEIGHT_PX = 12;

function getClosingFooterRenderHeightPx(footerHeightPx = 0): number {
  return Math.max(footerHeightPx, CLOSING_FOOTER_MIN_HEIGHT_PX);
}

type CalendarClosingFooterProps = {
  footerHeightPx?: number;
};

/** Faixa de fechamento na coluna lateral de horários (cinza + rótulo). */
export function CalendarClosingTimeLabel({
  label,
  footerHeightPx = 0,
}: CalendarClosingFooterProps & { label: string }) {
  const heightPx = getClosingFooterRenderHeightPx(footerHeightPx);

  return (
    <div
      className="relative shrink-0 bg-muted/40"
      style={{ height: `${heightPx}px` }}
    >
      <div className="absolute -top-3 right-3 flex h-6 items-center">
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
          {label}
        </span>
      </div>
    </div>
  );
}

/** Alinhamento da grade de consultas: mesma altura, fundo branco, sem rótulo de horário. */
export function CalendarClosingGridEnd({
  footerHeightPx = 0,
}: CalendarClosingFooterProps) {
  const heightPx = getClosingFooterRenderHeightPx(footerHeightPx);

  return (
    <div
      className="relative shrink-0 bg-background"
      style={{ height: `${heightPx}px` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-border/60" />
    </div>
  );
}
