'use client';

import type { FloorFixture, FloorTable } from '../types/floor-table';
import { TableFloorShape } from './table-floor-shape';
import { TablesFloorEmpty } from './tables-floor-empty';

type TablesFloorPlanProps = {
  tables: readonly FloorTable[];
  fixtures: readonly FloorFixture[];
  selectedTableId: string | null;
  onSelect: (tableId: string) => void;
  /** true quando o filtro/busca não retornou nenhuma mesa */
  isEmptyFilter: boolean;
};

const DOT_GRID =
  'radial-gradient(circle, #d4d4d4 1px, transparent 1px)';

export function TablesFloorPlan({
  tables,
  fixtures,
  selectedTableId,
  onSelect,
  isEmptyFilter,
}: TablesFloorPlanProps) {
  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-xs">
      <div className="absolute left-5 top-5 z-20 flex items-center gap-4 select-none">
        <div className="flex items-center gap-2">
          <span className="size-3.5 rounded-full border border-[#d4d4d4] bg-white" />
          <span className="text-xs font-medium text-[#737373]">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="size-3.5 rounded-full border border-[#d4d4d4]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-45deg, #d4d4d4 0 1px, transparent 1px 3px)',
              backgroundColor: '#f5f5f5',
            }}
          />
          <span className="text-xs font-medium text-[#737373]">Em uso</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3.5 rounded-full bg-primary" />
          <span className="text-xs font-medium text-[#737373]">Selecionada</span>
        </div>
      </div>

      {isEmptyFilter ? (
        <TablesFloorEmpty
          title="Nenhuma mesa encontrada"
          description="Ajuste a busca ou os filtros para ver as mesas no layout."
        />
      ) : (
        <div
          className="relative min-h-0 flex-1 m-3 mt-12 rounded-xl bg-[#fafafa]"
          style={{
            backgroundImage: DOT_GRID,
            backgroundSize: '16px 16px',
          }}
        >
          {fixtures.map((fixture) => {
            const rotationDeg = fixture.rotationDeg ?? 0;
            return (
              <div
                key={fixture.id}
                className="absolute flex items-center justify-center rounded-lg bg-[#e5e5e5] select-none"
                style={{
                  left: `${fixture.x}%`,
                  top: `${fixture.y}%`,
                  width: `${fixture.w}%`,
                  height: `${fixture.h}%`,
                  transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
                  transformOrigin: 'center center',
                }}
              >
                <span
                  className="text-xs font-semibold tracking-wide text-[#737373]"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {fixture.label}
                </span>
              </div>
            );
          })}

          {tables.map((table) => (
            <TableFloorShape
              key={table.id}
              table={table}
              selected={table.id === selectedTableId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
