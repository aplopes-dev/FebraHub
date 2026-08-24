'use client';

import { ToastItem } from './toast-item';
import type { ToastItemData } from './toast-types';

type ToastViewportProps = {
  toasts: readonly ToastItemData[];
  onDismiss: (id: string) => void;
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      data-pdv-toast-viewport
      className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
