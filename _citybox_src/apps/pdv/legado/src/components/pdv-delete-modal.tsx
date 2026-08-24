'use client';

import { XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@citybox/ui/atoms';

type PdvDeleteModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirmação de exclusão genérica — visual exclusivo do PDV (não usa o
 * ConfirmDialog do design system). Reaproveitada por qualquer feature do PDV
 * que precise confirmar uma exclusão (pedidos, clientes, ...).
 */
export function PdvDeleteModal({
  open,
  title,
  description,
  confirmLabel = 'Sim, Deletar',
  onCancel,
  onConfirm,
}: PdvDeleteModalProps) {
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
          <span
            className="relative flex size-14 items-center justify-center rounded-full"
            style={{ backgroundImage: 'linear-gradient(165deg, #F04D28 0%, #AA371C 100%)' }}
          >
            <XIcon className="size-7 text-white" strokeWidth={3} aria-hidden />
          </span>
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
            className="pdv-destructive-gradient-btn flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-white"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
