import type { ReactNode } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

/** Templates registrados. Novos layouts entram aqui. */
export type ToastTemplateName = "progress" | "simple";

export type ToastContent = {
  title: ReactNode;
  description?: ReactNode;
  variant: ToastVariant;
  duration: number;
  toastId: string | number;
  onDismiss: () => void;
};

export type ToastTemplateProps = ToastContent & {
  /** Nome do template (útil p/ estilos condicionais). */
  template: ToastTemplateName;
};

export type ToastTemplateComponent = (
  props: ToastTemplateProps,
) => ReactNode;

export type ToastShowOptions = {
  description?: ReactNode;
  duration?: number;
  /** Sobrescreve o template default do `Toaster`. */
  template?: ToastTemplateName;
  id?: string | number;
};

export type ToastConfig = {
  defaultTemplate: ToastTemplateName;
  defaultDuration: number;
};
