"use client";

import MuiAlert from "@mui/material/Alert";
import type { AlertProps as MuiAlertProps } from "@mui/material/Alert";
import MuiAlertTitle from "@mui/material/AlertTitle";
import type { AlertTitleProps as MuiAlertTitleProps } from "@mui/material/AlertTitle";

export type AlertProps = MuiAlertProps;
export type AlertTitleProps = MuiAlertTitleProps;

export function Alert(props: AlertProps) {
  return <MuiAlert {...props} />;
}

export function AlertTitle(props: AlertTitleProps) {
  return <MuiAlertTitle {...props} />;
}
