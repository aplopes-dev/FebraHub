'use client';

import { ScrollArea } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { formatCatalogPrice } from '@/features/pos/data/placeholder-catalog-products';
import type { FloorTable } from '../types/floor-table';

type TablesListProps = {
  tables: readonly FloorTable[];
  selectedTableId: string | null;
  onSelect: (tableId: string) => void;
};

export function TablesList({ tables, selectedTableId, onSelect }: TablesListProps) {
  if (tables.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center select-none">
        <p className="text-sm leading-relaxed text-[#a3a3a3]">Nenhuma mesa encontrada</p>
      </div>
    );
  }

  return (
    <ScrollArea type="scroll" className="min-h-0 flex-1 overflow-hidden">
      <ul className="divide-y divide-[#e5e5e5]">
        {tables.map((table) => {
          const isOccupied = table.status === 'occupied';
          const isSelected = table.id === selectedTableId;

          return (
            <li key={table.id}>
              <button
                type="button"
                onClick={() => onSelect(table.id)}
                className={cn(
                  'flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors cursor-pointer',
                  isSelected ? 'bg-primary/5' : 'hover:bg-black/[0.02]',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'size-2.5 shrink-0 rounded-full',
                      isOccupied ? 'bg-red-500' : 'bg-emerald-500',
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#171717]">
                    {table.name}
                  </span>
                  {isOccupied && table.totalCents != null && (
                    <span className="shrink-0 text-sm font-bold text-[#171717]">
                      {formatCatalogPrice(table.totalCents)}
                    </span>
                  )}
                </div>

                {isOccupied && (table.orderId || table.customerName) && (
                  <div className="flex items-center justify-between gap-2 pl-5 text-xs text-[#737373]">
                    <span className="truncate">
                      {table.orderId ? `Pedido #${table.orderId}` : ''}
                      {table.orderId && table.customerName ? ' · ' : ''}
                      {table.customerName ?? ''}
                    </span>
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
