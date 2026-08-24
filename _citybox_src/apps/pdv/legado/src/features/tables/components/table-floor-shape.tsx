'use client';

import { cn } from '@citybox/ui';
import type { FloorTable } from '../types/floor-table';

type TableFloorShapeProps = {
  table: FloorTable;
  selected: boolean;
  onSelect: (tableId: string) => void;
};

const OCCUPIED_HATCH =
  'repeating-linear-gradient(-45deg, #d4d4d4 0 1.5px, transparent 1.5px 4px)';

export function TableFloorShape({ table, selected, onSelect }: TableFloorShapeProps) {
  const labelNumber = table.name.replace(/^Mesa\s+/i, '');
  const isOccupied = table.status === 'occupied';
  const rotationDeg = table.rotationDeg ?? 0;

  const shapeRadius =
    table.shape === 'circle' ? 'rounded-full' : table.shape === 'square' ? 'rounded-xl' : 'rounded-2xl';

  return (
    <button
      type="button"
      onClick={() => onSelect(table.id)}
      className={cn(
        'absolute flex items-center justify-center border-2 bg-white text-sm font-semibold text-[#171717] transition-shadow cursor-pointer select-none',
        shapeRadius,
        selected
          ? 'border-primary shadow-[0_0_0_3px_rgba(23,23,23,0.15)]'
          : 'border-[#d4d4d4] hover:border-[#a3a3a3]',
      )}
      style={{
        left: `${table.x}%`,
        top: `${table.y}%`,
        width: `${table.w}%`,
        height: `${table.h}%`,
        backgroundColor: selected ? 'var(--primary)' : isOccupied ? '#f5f5f5' : '#ffffff',
        backgroundImage: !selected && isOccupied ? OCCUPIED_HATCH : undefined,
        color: selected ? 'var(--primary-foreground)' : '#171717',
        transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
        transformOrigin: 'center center',
      }}
      aria-label={table.name}
      aria-pressed={selected}
    >
      <span
        className="relative z-10"
        style={{ transform: rotationDeg ? `rotate(-${rotationDeg}deg)` : undefined }}
      >
        {labelNumber}
      </span>

      <span
        className={cn(
          'absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white',
          selected ? 'bg-white text-primary' : 'bg-[#171717]',
        )}
        style={{ transform: rotationDeg ? `rotate(-${rotationDeg}deg)` : undefined }}
      >
        {table.capacity}
      </span>
    </button>
  );
}
