import type { ToastVariant } from "./types";

/**
 * Cores pastel da barra de progresso — independentes da palette do app
 * para manter semântica visual estável entre temas.
 */
export const TOAST_PROGRESS_COLORS: Record<ToastVariant, string> = {
  success: "#A7F3D0", // mint
  error: "#FECACA", // rose
  info: "#BFDBFE", // sky
  warning: "#FDE68A", // amber
};

export const TOAST_ICON_COLORS: Record<ToastVariant, string> = {
  success: "#34D399",
  error: "#F87171",
  info: "#60A5FA",
  warning: "#FBBF24",
};
