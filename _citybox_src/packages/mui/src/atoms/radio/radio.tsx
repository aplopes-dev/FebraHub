"use client";

import MuiRadio from "@mui/material/Radio";
import type { RadioProps as MuiRadioProps } from "@mui/material/Radio";

export type RadioProps = MuiRadioProps;

export function Radio(props: RadioProps) {
  return <MuiRadio {...props} />;
}
