"use client";

import { useEffect, type CSSProperties } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Toaster as SonnerToaster,
  type ToasterProps as SonnerToasterProps,
} from "sonner";
import { configureToast } from "./toast-config";
import type { ToastTemplateName } from "./types";

export type ToasterProps = Omit<
  SonnerToasterProps,
  "theme" | "toastOptions"
> & {
  /** Template default para `toast.*` (default: `progress`). */
  template?: ToastTemplateName;
  /** Duração default em ms (default: 4000). */
  duration?: number;
  toastOptions?: SonnerToasterProps["toastOptions"];
};

/**
 * Host do sistema de toast. Monte uma vez no layout do app
 * (dentro de `CityboxMuiProvider` para herdar o tema).
 */
export function Toaster({
  template = "progress",
  duration = 4_000,
  position = "bottom-right",
  expand = false,
  gap = 12,
  visibleToasts = 4,
  toastOptions,
  style,
  ...props
}: ToasterProps) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  useEffect(() => {
    configureToast({
      defaultTemplate: template,
      defaultDuration: duration,
    });
  }, [template, duration]);

  return (
    <SonnerToaster
      theme={mode}
      position={position}
      expand={expand}
      gap={gap}
      visibleToasts={visibleToasts}
      duration={duration}
      toastOptions={{
        unstyled: true,
        ...toastOptions,
      }}
      style={
        {
          "--width": "360px",
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}
