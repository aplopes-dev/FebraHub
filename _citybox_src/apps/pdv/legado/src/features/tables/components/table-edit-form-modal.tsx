'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Input } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { PdvConfirmModal } from '@/components/pdv-confirm-modal';
import { preventDialogDismissOnToast } from '@/components/toast';
import type {
  FloorTable,
  FloorTableCapacity,
  FloorTableShape,
} from '../types/floor-table';

export type TableEditFormValues = {
  name: string;
  capacity: FloorTableCapacity;
  shape: FloorTableShape;
};

type TableEditFormModalProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initial: TableEditFormValues | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TableEditFormValues) => void;
};

const CAPACITY_OPTIONS: readonly FloorTableCapacity[] = [2, 4, 6] as const;

const SHAPE_OPTIONS: readonly { id: FloorTableShape; label: string }[] = [
  { id: 'circle', label: 'Círculo' },
  { id: 'square', label: 'Quadrado' },
  { id: 'rect', label: 'Retângulo' },
] as const;

export function TableEditFormModal({
  open,
  mode,
  initial,
  onOpenChange,
  onSubmit,
}: TableEditFormModalProps) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<FloorTableCapacity>(2);
  const [shape, setShape] = useState<FloorTableShape>('circle');
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsEditConfirmOpen(false);
      return;
    }
    setName(initial?.name ?? '');
    setCapacity(initial?.capacity ?? 2);
    setShape(initial?.shape ?? 'circle');
  }, [open, initial]);

  const canSubmit = name.trim().length > 0;

  const applySubmit = () => {
    onSubmit({
      name: name.trim(),
      capacity,
      shape,
    });
    setIsEditConfirmOpen(false);
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (mode === 'edit') {
      setIsEditConfirmOpen(true);
      return;
    }
    applySubmit();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          onPointerDownOutside={preventDialogDismissOnToast}
          onInteractOutside={preventDialogDismissOnToast}
          onFocusOutside={preventDialogDismissOnToast}
          className="flex w-full max-w-[420px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl sm:max-w-[420px]"
        >
          <DialogTitle className="sr-only">
            {mode === 'add' ? 'Adicionar mesa' : 'Editar mesa'}
          </DialogTitle>

          <div className="border-b border-[#e5e5e5] px-6 py-4">
            <h2 className="text-lg font-bold text-[#171717]">
              {mode === 'add' ? 'Adicionar mesa' : 'Editar mesa'}
            </h2>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-[#171717]">Nome</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Mesa 21"
                className="h-11 rounded-xl border-[#e5e5e5] bg-white text-sm focus:border-primary"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-[#171717]">Capacidade</span>
              <div className="flex gap-2">
                {CAPACITY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      'flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-semibold cursor-pointer',
                      capacity === option
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-[#e5e5e5] bg-white text-[#171717] hover:bg-black/[0.02]',
                    )}
                    onClick={() => setCapacity(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-[#171717]">Forma</span>
              <div className="flex gap-2">
                {SHAPE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={cn(
                      'flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-semibold cursor-pointer',
                      shape === option.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-[#e5e5e5] bg-white text-[#171717] hover:bg-black/[0.02]',
                    )}
                    onClick={() => setShape(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-[#e5e5e5] px-6 py-4">
            <button
              type="button"
              className="pdv-gradient-border-btn flex h-11 items-center justify-center rounded-xl text-sm font-bold text-[#171717] cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              className="pdv-primary-gradient-btn flex h-11 items-center justify-center rounded-xl text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleSubmit}
            >
              {mode === 'add' ? 'Adicionar' : 'Salvar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <PdvConfirmModal
        open={isEditConfirmOpen}
        title="Salvar alterações?"
        description={`Confirma as alterações em ${name.trim() || 'esta mesa'}?`}
        confirmLabel="Sim, Salvar"
        onCancel={() => setIsEditConfirmOpen(false)}
        onConfirm={applySubmit}
      />
    </>
  );
}

export function defaultSizeForShape(shape: FloorTableShape): { w: number; h: number } {
  switch (shape) {
    case 'square':
      return { w: 8, h: 12 };
    case 'rect':
      return { w: 14, h: 10 };
    case 'circle':
    default:
      return { w: 7, h: 10 };
  }
}

export function nextTableName(tables: readonly FloorTable[]): string {
  let max = 0;
  for (const table of tables) {
    const match = /^Mesa\s+(\d+)$/i.exec(table.name.trim());
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `Mesa ${max + 1}`;
}
