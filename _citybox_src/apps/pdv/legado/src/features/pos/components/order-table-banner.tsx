'use client';

import { LayoutGridIcon, XIcon } from 'lucide-react';
import type { PosTable } from '../types/table';

type OrderTableBannerProps = {
  table: PosTable;
  onRemove: () => void;
  onOpen: () => void;
};

/**
 * Indica a mesa vinculada ao pedido.
 */
export function OrderTableBanner({
  table,
  onRemove,
  onOpen,
}: OrderTableBannerProps) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-xl border border-[#dbeafe] bg-[#f0f7ff] px-3 py-2.5"
      role="status"
      aria-label={`Mesa do pedido: ${table.number}`}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-primary"
        onClick={onOpen}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white border border-[#dbeafe] text-[#2563eb]">
          <LayoutGridIcon className="size-4" aria-hidden strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[#1e3a8a]">
            {table.number}
          </span>
          <span className="block truncate text-xs font-medium text-[#3b82f6]">
            {table.status === 'occupied' ? 'Consumo em andamento' : 'Mesa vinculada'}
          </span>
        </span>
      </button>
      <button
        type="button"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#3b82f6] transition-colors hover:bg-[#dbeafe] hover:text-[#1e3a8a] active:bg-[#bfdbfe]"
        aria-label="Desvincular mesa do pedido"
        onClick={onRemove}
      >
        <XIcon className="size-4" aria-hidden strokeWidth={2} />
      </button>
    </div>
  );
}
