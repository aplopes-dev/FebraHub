"use client";

import MuiAvatar from "@mui/material/Avatar";
import type { AvatarProps as MuiAvatarProps } from "@mui/material/Avatar";

export type AvatarProps = MuiAvatarProps;

/** Thin wrapper MUI Avatar. */
export function Avatar(props: AvatarProps) {
  return <MuiAvatar {...props} />;
}
