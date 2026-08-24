"use client";

import { createElement, type ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { getToastDefaults } from "./toast-config";
import { ToastItem } from "./toast-item";
import type {
  ToastShowOptions,
  ToastTemplateName,
  ToastVariant,
} from "./types";

function resolveDuration(options?: ToastShowOptions): number {
  return options?.duration ?? getToastDefaults().defaultDuration;
}

function resolveTemplate(options?: ToastShowOptions): ToastTemplateName {
  return options?.template ?? getToastDefaults().defaultTemplate;
}

function show(
  variant: ToastVariant,
  title: ReactNode,
  options?: ToastShowOptions,
) {
  const duration = resolveDuration(options);
  const template = resolveTemplate(options);

  return sonnerToast.custom(
    (toastId) =>
      createElement(ToastItem, {
        toastId,
        title,
        description: options?.description,
        variant,
        duration,
        template,
        onDismiss: () => sonnerToast.dismiss(toastId),
      }),
    {
      id: options?.id,
      duration,
      unstyled: true,
    },
  );
}

/**
 * API imperativa de toast — mesma forma do sonner (`success`/`error`/…),
 * renderizando os templates Citybox.
 */
export const toast = {
  success: (title: ReactNode, options?: ToastShowOptions) =>
    show("success", title, options),
  error: (title: ReactNode, options?: ToastShowOptions) =>
    show("error", title, options),
  info: (title: ReactNode, options?: ToastShowOptions) =>
    show("info", title, options),
  warning: (title: ReactNode, options?: ToastShowOptions) =>
    show("warning", title, options),
  /** Alias semântico → `info` (compatível com `toast.message` do sonner). */
  message: (title: ReactNode, options?: ToastShowOptions) =>
    show("info", title, options),
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
};
