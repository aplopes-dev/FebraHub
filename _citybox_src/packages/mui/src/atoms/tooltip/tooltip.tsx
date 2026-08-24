"use client";

import MuiTooltip from "@mui/material/Tooltip";
import type { TooltipProps as MuiTooltipProps } from "@mui/material/Tooltip";

export type TooltipProps = MuiTooltipProps;

export function Tooltip({ arrow = true, ...props }: TooltipProps) {
  return <MuiTooltip arrow={arrow} {...props} />;
}
