"use client";

import MuiTypography from "@mui/material/Typography";
import type { TypographyProps as MuiTypographyProps } from "@mui/material/Typography";

export type TypographyProps = MuiTypographyProps;

export function Typography(props: TypographyProps) {
  return <MuiTypography {...props} />;
}
