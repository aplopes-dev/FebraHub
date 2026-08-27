"use client";

import MuiSwitch from "@mui/material/Switch";
import type { SwitchProps as MuiSwitchProps } from "@mui/material/Switch";

export type SwitchProps = MuiSwitchProps;

export function Switch(props: SwitchProps) {
  return <MuiSwitch {...props} />;
}
