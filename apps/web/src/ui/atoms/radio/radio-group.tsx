"use client";

import MuiRadioGroup from "@mui/material/RadioGroup";
import type { RadioGroupProps as MuiRadioGroupProps } from "@mui/material/RadioGroup";

export type RadioGroupProps = MuiRadioGroupProps;

export function RadioGroup(props: RadioGroupProps) {
  return <MuiRadioGroup {...props} />;
}
