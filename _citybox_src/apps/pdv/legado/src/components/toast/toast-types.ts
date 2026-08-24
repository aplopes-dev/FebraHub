export type ToastVariant = 'error' | 'success' | 'warning' | 'info';

export type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Duração em ms (padrão 5000). */
  durationMs?: number;
};

export type ToastItemData = ToastInput & {
  id: string;
  variant: ToastVariant;
  durationMs: number;
};

export const TOAST_DEFAULT_DURATION_MS = 5000;
