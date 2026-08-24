"use client";

import type { ReactNode } from "react";
import MuiDialog from "@mui/material/Dialog";
import type { DialogProps as MuiDialogProps } from "@mui/material/Dialog";
import MuiDialogActions from "@mui/material/DialogActions";
import type { DialogActionsProps as MuiDialogActionsProps } from "@mui/material/DialogActions";
import MuiDialogContent from "@mui/material/DialogContent";
import type { DialogContentProps as MuiDialogContentProps } from "@mui/material/DialogContent";
import MuiDialogContentText from "@mui/material/DialogContentText";
import type { DialogContentTextProps as MuiDialogContentTextProps } from "@mui/material/DialogContentText";
import MuiDialogTitle from "@mui/material/DialogTitle";
import type { DialogTitleProps as MuiDialogTitleProps } from "@mui/material/DialogTitle";

export type DialogProps = MuiDialogProps;
export type DialogTitleProps = MuiDialogTitleProps;
export type DialogContentProps = MuiDialogContentProps;
export type DialogContentTextProps = MuiDialogContentTextProps;
export type DialogActionsProps = MuiDialogActionsProps;

export function Dialog({ fullWidth = true, maxWidth = "sm", ...props }: DialogProps) {
  return <MuiDialog fullWidth={fullWidth} maxWidth={maxWidth} {...props} />;
}

export function DialogTitle(props: DialogTitleProps) {
  return <MuiDialogTitle {...props} />;
}

export function DialogContent(props: DialogContentProps) {
  return <MuiDialogContent {...props} />;
}

export function DialogContentText(props: DialogContentTextProps) {
  return <MuiDialogContentText {...props} />;
}

export function DialogActions({
  children,
  sx,
  ...props
}: DialogActionsProps & { children?: ReactNode }) {
  return (
    <MuiDialogActions sx={[{ px: 3, pb: 2 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...props}>
      {children}
    </MuiDialogActions>
  );
}
