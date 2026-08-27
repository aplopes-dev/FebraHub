"use client";

import useMediaQuery from "@mui/material/useMediaQuery";

/** Alinhado ao `Breakpoint` do `apps/app` (Angular CDK). */
export const LAYOUT_MOBILE_QUERY = "(max-width:599.98px)";
export const LAYOUT_COMPACT_QUERY = "(max-width:1199.98px)";

export type ShellLayoutMode = "desktop" | "tablet" | "mobile";

export function useLayoutBreakpoints() {
  const isMobile = useMediaQuery(LAYOUT_MOBILE_QUERY);
  const isCompact = useMediaQuery(LAYOUT_COMPACT_QUERY);

  const mode: ShellLayoutMode = isMobile
    ? "mobile"
    : isCompact
      ? "tablet"
      : "desktop";

  return {
    isMobile,
    isCompact,
    isDesktop: !isCompact,
    mode,
  };
}
