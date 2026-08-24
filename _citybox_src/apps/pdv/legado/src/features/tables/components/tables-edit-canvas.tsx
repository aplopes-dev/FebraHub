'use client';

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@citybox/ui';
import type { FloorFixture, FloorTable } from '../types/floor-table';
import { TableEditToolbar } from './table-edit-toolbar';
import { TablesFloorEmpty } from './tables-floor-empty';

export type FloorSelection =
  | { kind: 'table'; id: string }
  | { kind: 'fixture'; id: string }
  | null;

type TablesEditCanvasProps = {
  tables: readonly FloorTable[];
  fixtures: readonly FloorFixture[];
  selection: FloorSelection;
  onSelect: (selection: FloorSelection) => void;
  onMoveTable: (tableId: string, x: number, y: number) => void;
  onMoveFixture: (fixtureId: string, x: number, y: number) => void;
  onRotateTable: (tableId: string) => void;
  onRotateFixture: (fixtureId: string) => void;
  onEditTable: (tableId: string) => void;
  onDeleteTable: (tableId: string) => void;
};

const DOT_GRID = 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)';
const DRAG_THRESHOLD_PX = 4;

type DragState = {
  kind: 'table' | 'fixture';
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function TablesEditCanvas({
  tables,
  fixtures,
  selection,
  onSelect,
  onMoveTable,
  onMoveFixture,
  onRotateTable,
  onRotateFixture,
  onEditTable,
  onDeleteTable,
}: TablesEditCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedTable =
    selection?.kind === 'table' ? (tables.find((table) => table.id === selection.id) ?? null) : null;
  const selectedFixture =
    selection?.kind === 'fixture'
      ? (fixtures.find((fixture) => fixture.id === selection.id) ?? null)
      : null;

  const handleCanvasPointerDown = () => {
    if (!dragRef.current) {
      onSelect(null);
    }
  };

  const beginDrag = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      kind: 'table' | 'fixture',
      id: string,
      x: number,
      y: number,
    ) => {
      event.stopPropagation();
      event.preventDefault();

      onSelect({ kind, id });
      event.currentTarget.setPointerCapture(event.pointerId);

      dragRef.current = {
        kind,
        id,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: x,
        originY: y,
        moved: false,
      };
    },
    [onSelect],
  );

  const handleDragMove = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      kind: 'table' | 'fixture',
      id: string,
      w: number,
      h: number,
    ) => {
      const drag = dragRef.current;
      if (!drag || drag.kind !== kind || drag.id !== id || drag.pointerId !== event.pointerId) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dx = event.clientX - drag.startClientX;
      const dy = event.clientY - drag.startClientY;

      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
        return;
      }

      if (!drag.moved) {
        drag.moved = true;
        setIsDragging(true);
      }

      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const nextX = clamp(drag.originX + (dx / rect.width) * 100, 0, 100 - w);
      const nextY = clamp(drag.originY + (dy / rect.height) * 100, 0, 100 - h);

      if (kind === 'table') {
        onMoveTable(id, nextX, nextY);
      } else {
        onMoveFixture(id, nextX, nextY);
      }
    },
    [onMoveFixture, onMoveTable],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, kind: 'table' | 'fixture', id: string) => {
      const drag = dragRef.current;
      if (!drag || drag.kind !== kind || drag.id !== id || drag.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      dragRef.current = null;
      setIsDragging(false);
    },
    [],
  );

  return (
    <div
      ref={canvasRef}
      className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#fafafa] shadow-xs"
      style={{
        backgroundImage: DOT_GRID,
        backgroundSize: '16px 16px',
      }}
      onPointerDown={handleCanvasPointerDown}
    >
      {tables.length === 0 && fixtures.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <TablesFloorEmpty
            title="Nenhuma mesa definida"
            description='Comece a personalizar o layout tocando no botão "Adicionar mesa"'
          />
        </div>
      ) : null}

      {fixtures.map((fixture) => {
        const isSelected = selection?.kind === 'fixture' && selection.id === fixture.id;
        const rotationDeg = fixture.rotationDeg ?? 0;

        return (
          <button
            key={fixture.id}
            type="button"
            onPointerDown={(event) =>
              beginDrag(event, 'fixture', fixture.id, fixture.x, fixture.y)
            }
            onPointerMove={(event) =>
              handleDragMove(event, 'fixture', fixture.id, fixture.w, fixture.h)
            }
            onPointerUp={(event) => endDrag(event, 'fixture', fixture.id)}
            onPointerCancel={(event) => endDrag(event, 'fixture', fixture.id)}
            className={cn(
              'absolute flex touch-none items-center justify-center rounded-lg bg-[#e5e5e5] select-none',
              isDragging && isSelected ? 'cursor-grabbing' : 'cursor-grab',
              isSelected
                ? 'z-20 ring-2 ring-primary ring-offset-2'
                : 'z-10 border border-transparent',
            )}
            style={{
              left: `${fixture.x}%`,
              top: `${fixture.y}%`,
              width: `${fixture.w}%`,
              height: `${fixture.h}%`,
              transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
              transformOrigin: 'center center',
            }}
            aria-label={fixture.label}
            aria-pressed={isSelected}
          >
            <span
              className="text-xs font-semibold tracking-wide text-[#737373]"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {fixture.label}
            </span>
          </button>
        );
      })}

      {tables.map((table) => {
        const isSelected = selection?.kind === 'table' && selection.id === table.id;
        const shapeRadius =
          table.shape === 'circle'
            ? 'rounded-full'
            : table.shape === 'square'
              ? 'rounded-xl'
              : 'rounded-2xl';
        const labelNumber = table.name.replace(/^Mesa\s+/i, '');
        const rotationDeg = table.rotationDeg ?? 0;

        return (
          <button
            key={table.id}
            type="button"
            onPointerDown={(event) => beginDrag(event, 'table', table.id, table.x, table.y)}
            onPointerMove={(event) => handleDragMove(event, 'table', table.id, table.w, table.h)}
            onPointerUp={(event) => endDrag(event, 'table', table.id)}
            onPointerCancel={(event) => endDrag(event, 'table', table.id)}
            className={cn(
              'absolute flex touch-none items-center justify-center border-2 bg-white text-sm font-semibold text-[#171717] select-none',
              shapeRadius,
              isDragging && isSelected ? 'cursor-grabbing' : 'cursor-grab',
              isSelected
                ? 'z-20 border-primary shadow-[0_0_0_3px_rgba(23,23,23,0.15)]'
                : 'z-10 border-[#d4d4d4]',
            )}
            style={{
              left: `${table.x}%`,
              top: `${table.y}%`,
              width: `${table.w}%`,
              height: `${table.h}%`,
              transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
              transformOrigin: 'center center',
            }}
            aria-label={table.name}
            aria-pressed={isSelected}
          >
            <span style={{ transform: rotationDeg ? `rotate(-${rotationDeg}deg)` : undefined }}>
              {labelNumber}
            </span>
            <span
              className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[#171717] text-[10px] font-bold text-white"
              style={{ transform: rotationDeg ? `rotate(-${rotationDeg}deg)` : undefined }}
            >
              {table.capacity}
            </span>
          </button>
        );
      })}

      {selectedTable && !isDragging && (
        <TableEditToolbar
          leftPercent={selectedTable.x + selectedTable.w / 2}
          topPercent={selectedTable.y}
          onRotate={() => onRotateTable(selectedTable.id)}
          onEdit={() => onEditTable(selectedTable.id)}
          onDelete={() => onDeleteTable(selectedTable.id)}
          showEditActions
        />
      )}

      {selectedFixture && !isDragging && (
        <TableEditToolbar
          leftPercent={selectedFixture.x + selectedFixture.w / 2}
          topPercent={selectedFixture.y}
          onRotate={() => onRotateFixture(selectedFixture.id)}
          showEditActions={false}
        />
      )}
    </div>
  );
}
