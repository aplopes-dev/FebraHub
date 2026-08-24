"use client";

import MuiPopover from "@mui/material/Popover";
import type { PopoverProps as MuiPopoverProps } from "@mui/material/Popover";

export type PopoverProps = MuiPopoverProps;

export function Popover(props: PopoverProps) {
  return <MuiPopover {...props} />;
}
