'use client';

import { CheckIcon, AlertCircleIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@citybox/ui/atoms';

type PdvConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'check' | 'warning';
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirmação genérica do PDV (check ou warning).
 */
export function PdvConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'check',
  onCancel,
  onConfirm,
}: PdvConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="flex w-full max-w-[420px] flex-col items-center gap-0 overflow-hidden rounded-2xl border-none bg-white p-8 text-center shadow-2xl sm:max-w-[420px]"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className="relative mb-5 flex size-[72px] items-center justify-center">
          <span
            className="absolute inset-0 rounded-full border-[3px] border-[#E8E8E8]"
            aria-hidden
          />
          {variant === 'warning' ? (
            <span className="relative flex size-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
              <AlertCircleIcon className="size-8 text-white" strokeWidth={2.5} aria-hidden />
            </span>
          ) : (
            <span className="pdv-primary-gradient-btn relative flex size-14 items-center justify-center rounded-full">
              <CheckIcon className="size-7 text-white" strokeWidth={3} aria-hidden />
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-[#171717]">{title}</h2>
        <p className="mt-3 text-sm font-medium leading-5 text-[#737373]">{description}</p>

        <div className="mt-8 grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            className="pdv-gradient-border-btn flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-[#171717] cursor-pointer"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="pdv-primary-gradient-btn flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-white cursor-pointer"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
