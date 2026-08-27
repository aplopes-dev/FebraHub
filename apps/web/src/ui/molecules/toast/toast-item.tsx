"use client";

import { TOAST_TEMPLATES } from "./templates";
import type { ToastTemplateName, ToastTemplateProps } from "./types";

type ToastItemProps = Omit<ToastTemplateProps, "template"> & {
  template?: ToastTemplateName;
};

/**
 * Resolve o template registrado e renderiza o layout correspondente.
 */
export function ToastItem({
  template = "progress",
  ...content
}: ToastItemProps) {
  const Template = TOAST_TEMPLATES[template] ?? TOAST_TEMPLATES.progress;
  return <Template template={template} {...content} />;
}
