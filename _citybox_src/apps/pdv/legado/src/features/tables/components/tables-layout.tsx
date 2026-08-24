'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SearchIcon,
  ChevronDownIcon,
  PencilIcon,
  CheckIcon,
} from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@citybox/ui/atoms';
import { useFloorLayoutStore } from '../hooks/use-floor-layout-store';
import type { FloorTableCapacity, FloorTableStatus } from '../types/floor-table';
import { TablesFloorPlan } from './tables-floor-plan';
import { TablesList } from './tables-list';

type TableFilter = 'all' | FloorTableStatus;
type CapacityFilter = 'all' | FloorTableCapacity;

const TABLE_FILTER_OPTIONS: readonly { id: TableFilter; label: string }[] = [
  { id: 'all', label: 'Todas as mesas' },
  { id: 'available', label: 'Disponíveis' },
  { id: 'occupied', label: 'Ocupadas' },
] as const;

const CAPACITY_FILTER_OPTIONS: readonly { id: CapacityFilter; label: string }[] = [
  { id: 'all', label: 'Todas as capacidades' },
  { id: 2, label: '2 lugares' },
  { id: 4, label: '4 lugares' },
  { id: 6, label: '6 lugares' },
] as const;

export function TablesLayout() {
  const router = useRouter();
  const tables = useFloorLayoutStore((state) => state.tables);
  const fixtures = useFloorLayoutStore((state) => state.fixtures);
  const showCashier = useFloorLayoutStore((state) => state.showCashier);

  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<TableFilter>('all');
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>('all');
  const [isTableFilterOpen, setIsTableFilterOpen] = useState(false);
  const [isCapacityFilterOpen, setIsCapacityFilterOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const tableFilterLabel =
    TABLE_FILTER_OPTIONS.find((option) => option.id === tableFilter)?.label ?? 'Todas as mesas';
  const capacityFilterLabel =
    CAPACITY_FILTER_OPTIONS.find((option) => option.id === capacityFilter)?.label ??
    'Todas as capacidades';

  const filteredTables = useMemo(() => {
    let result = [...tables];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((table) => table.name.toLowerCase().includes(q));
    }

    if (tableFilter !== 'all') {
      result = result.filter((table) => table.status === tableFilter);
    }

    if (capacityFilter !== 'all') {
      result = result.filter((table) => table.capacity === capacityFilter);
    }

    return result;
  }, [tables, searchQuery, tableFilter, capacityFilter]);

  const visibleFixtures = useMemo(
    () => (showCashier ? fixtures : []),
    [fixtures, showCashier],
  );

  const isEmptyFilter = filteredTables.length === 0;

  const handleEditLayout = () => {
    router.push('/mesas/editar-layout');
  };

  const handleSelect = (tableId: string) => {
    setSelectedTableId((current) => (current === tableId ? null : tableId));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-4 select-none">
        <h1 className="text-xl font-bold text-[#171717]">Mesas</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#737373]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nome da mesa..."
              className="h-10 w-[240px] rounded-xl border-[#e5e5e5] bg-white text-sm focus:border-primary !pl-10 !pr-4"
            />
          </div>

          <Popover open={isTableFilterOpen} onOpenChange={setIsTableFilterOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-10 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold cursor-pointer',
                  tableFilter !== 'all'
                    ? 'border-primary/20 bg-primary/5 text-primary'
                    : 'border-[#e5e5e5] bg-white text-[#171717] hover:bg-black/[0.02]',
                )}
              >
                <span>{tableFilterLabel}</span>
                <ChevronDownIcon className="size-4 text-[#737373]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 flex-col gap-1 p-1.5">
              {TABLE_FILTER_OPTIONS.map((option) => {
                const isActive = option.id === tableFilter;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer',
                      isActive
                        ? 'bg-primary/5 text-primary'
                        : 'text-[#171717] hover:bg-black/[0.04]',
                    )}
                    onClick={() => {
                      setTableFilter(option.id);
                      setIsTableFilterOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {isActive && <CheckIcon className="size-4" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          <Popover open={isCapacityFilterOpen} onOpenChange={setIsCapacityFilterOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-10 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold cursor-pointer',
                  capacityFilter !== 'all'
                    ? 'border-primary/20 bg-primary/5 text-primary'
                    : 'border-[#e5e5e5] bg-white text-[#171717] hover:bg-black/[0.02]',
                )}
              >
                <span>{capacityFilterLabel}</span>
                <ChevronDownIcon className="size-4 text-[#737373]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 flex-col gap-1 p-1.5">
              {CAPACITY_FILTER_OPTIONS.map((option) => {
                const isActive = option.id === capacityFilter;
                return (
                  <button
                    key={String(option.id)}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer',
                      isActive
                        ? 'bg-primary/5 text-primary'
                        : 'text-[#171717] hover:bg-black/[0.04]',
                    )}
                    onClick={() => {
                      setCapacityFilter(option.id);
                      setIsCapacityFilterOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {isActive && <CheckIcon className="size-4" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          <button
            type="button"
            onClick={handleEditLayout}
            className="pdv-primary-gradient-btn flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PencilIcon className="size-4" />
            <span>Editar Layout</span>
          </button>
        </div>
      </div>

      {/* Two panels */}
      <div className="flex min-h-0 flex-1 gap-4">
        <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-xs">
          <TablesList
            tables={filteredTables}
            selectedTableId={selectedTableId}
            onSelect={handleSelect}
          />
        </aside>

        <TablesFloorPlan
          tables={filteredTables}
          fixtures={visibleFixtures}
          selectedTableId={selectedTableId}
          onSelect={handleSelect}
          isEmptyFilter={isEmptyFilter}
        />
      </div>
    </div>
  );
}
