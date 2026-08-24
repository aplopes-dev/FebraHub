'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  ScrollArea,
} from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { SearchIcon } from 'lucide-react';
import { preventDialogDismissOnToast } from '@/components/toast';
import { useToast } from '@/components/toast';
import { formatCatalogPrice } from '../data/placeholder-catalog-products';
import { usePosStore } from '../hooks/use-pos-store';
import { useFloorLayoutStore } from '@/features/tables/hooks/use-floor-layout-store';
import type { FloorTable } from '@/features/tables/types/floor-table';

type TablesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Padrão hachura para mesa ocupada (igual ao `TableFloorShape`). */
const OCCUPIED_HATCH =
  'repeating-linear-gradient(-45deg, #d4d4d4 0 1.5px, transparent 1.5px 4px)';

/** Grid de pontos para o canvas do floor plan. */
const DOT_GRID = 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)';

export function TablesModal({ open, onOpenChange }: TablesModalProps) {
  const { toast } = useToast();

  /* POS store — vinculação de mesa ao pedido */
  const activeTableId = usePosStore((state) => state.activeTableId);
  const posSetTable = usePosStore((state) => state.setTable);
  const posTables = usePosStore((state) => state.tables);

  /* Floor layout store — dados visuais (layout da página de mesas) */
  const floorTables = useFloorLayoutStore((state) => state.tables);
  const fixtures = useFloorLayoutStore((state) => state.fixtures);
  const showCashier = useFloorLayoutStore((state) => state.showCashier);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloorTableId, setSelectedFloorTableId] = useState<string | null>(null);

  /* Filtro de busca */
  const filteredFloorTables = useMemo(() => {
    if (!searchQuery.trim()) return floorTables;
    const q = searchQuery.toLowerCase().trim();
    return floorTables.filter((t) => t.name.toLowerCase().includes(q));
  }, [floorTables, searchQuery]);

  const visibleFixtures = useMemo(
    () => (showCashier ? fixtures : []),
    [fixtures, showCashier],
  );

  /** Mapeia uma mesa do floor plan para a mesa correspondente no POS store */
  const findPosTable = (floorTable: FloorTable) => {
    // Usa o nome como chave de correspondência (ex: "Mesa 1" ↔ "Mesa 01")
    return posTables.find(
      (pt) =>
        pt.id === floorTable.id ||
        pt.number.replace(/\s+0?/g, ' ').trim().toLowerCase() ===
          floorTable.name.replace(/\s+0?/g, ' ').trim().toLowerCase(),
    );
  };

  /** Calcula total de consumo de uma PosTable */
  const getTableTotal = (tableId: string) => {
    const posTable = posTables.find((t) => t.id === tableId);
    if (!posTable) return 0;
    return posTable.items.reduce((total, item) => {
      const optionsTotal = item.selectedOptions.reduce(
        (acc, opt) => acc + opt.priceCents,
        0,
      );
      return total + (item.priceCents + optionsTotal) * item.quantity;
    }, 0);
  };

  /** Determina o status efetivo (considerando dados do POS store) */
  const getEffectiveStatus = (floorTable: FloorTable) => {
    const posTable = findPosTable(floorTable);
    if (posTable) {
      if (posTable.status === 'reserved') return 'reserved' as const;
      if (posTable.status === 'occupied' || posTable.items.length > 0) return 'occupied' as const;
    }
    return floorTable.status;
  };

  const handleSelect = (floorTable: FloorTable) => {
    setSelectedFloorTableId((prev) =>
      prev === floorTable.id ? null : floorTable.id,
    );
  };

  const handleConfirm = () => {
    if (!selectedFloorTableId) return;
    const floorTable = floorTables.find((t) => t.id === selectedFloorTableId);
    if (!floorTable) return;

    const posTable = findPosTable(floorTable);

    if (posTable?.status === 'reserved') {
      toast({
        variant: 'warning',
        title: 'Mesa Reservada',
        description: `Esta mesa está reservada: ${posTable.customerName || 'Reserva ativa'}.`,
      });
      return;
    }

    if (posTable) {
      posSetTable(posTable.id);
      if (posTable.status === 'occupied') {
        toast({
          variant: 'success',
          title: 'Conta carregada',
          description: `Consumo ativo da ${floorTable.name} carregado no carrinho.`,
        });
      } else {
        toast({
          variant: 'success',
          title: 'Mesa vinculada',
          description: `${floorTable.name} vinculada ao carrinho atual.`,
        });
      }
    } else {
      // Não há correspondência no POS store — informar
      toast({
        variant: 'info',
        title: 'Mesa selecionada',
        description: `${floorTable.name} selecionada (sem dados de pedido).`,
      });
    }

    onOpenChange(false);
  };

  const selectedFloorTable = selectedFloorTableId
    ? floorTables.find((t) => t.id === selectedFloorTableId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={preventDialogDismissOnToast}
        onInteractOutside={preventDialogDismissOnToast}
        onFocusOutside={preventDialogDismissOnToast}
        className="flex w-full max-w-[900px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[900px]"
      >
        <DialogTitle className="sr-only">Seleção de Mesa</DialogTitle>

        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between bg-[#171717] px-6 py-4">
          <h2 className="text-lg font-bold tracking-tight text-white">
            Selecionar Mesa
          </h2>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mesa..."
              className="h-9 w-[200px] rounded-lg border-white/10 bg-white/10 text-sm text-white placeholder:text-white/40 focus:border-white/30 !pl-9 !pr-3"
            />
          </div>
        </div>

        {/* Body — list sidebar + floor plan */}
        <div className="flex h-[520px] bg-[#F7F7F7]">
          {/* Left sidebar — table list */}
          <aside className="flex w-[240px] shrink-0 flex-col border-r border-[#e5e5e5] bg-white">
            <div className="shrink-0 border-b border-[#e5e5e5] px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Mesas ({filteredFloorTables.length})
              </span>
            </div>
            <ScrollArea type="scroll" className="min-h-0 flex-1 overflow-hidden">
              <ul className="divide-y divide-[#e5e5e5]">
                {filteredFloorTables.map((table) => {
                  const effectiveStatus = getEffectiveStatus(table);
                  const isSelected = table.id === selectedFloorTableId;
                  const isLinked = activeTableId != null && findPosTable(table)?.id === activeTableId;
                  const posTable = findPosTable(table);
                  const totalCents = posTable ? getTableTotal(posTable.id) : 0;

                  return (
                    <li key={table.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(table)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-primary/5'
                            : isLinked
                              ? 'bg-blue-50/60'
                              : 'hover:bg-black/[0.02]',
                        )}
                      >
                        <span
                          className={cn(
                            'size-2.5 shrink-0 rounded-full',
                            effectiveStatus === 'occupied'
                              ? 'bg-red-500'
                              : effectiveStatus === 'reserved'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500',
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#171717]">
                            {table.name}
                          </span>
                          <span className="block text-[11px] font-medium text-[#737373]">
                            {table.capacity} lugares · {table.shape === 'circle' ? 'Redonda' : table.shape === 'square' ? 'Quadrada' : 'Retangular'}
                          </span>
                        </span>
                        {effectiveStatus === 'occupied' && totalCents > 0 && (
                          <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-100">
                            {formatCatalogPrice(totalCents)}
                          </span>
                        )}
                        {effectiveStatus === 'reserved' && (
                          <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-100">
                            Reservada
                          </span>
                        )}
                        {isLinked && (
                          <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                            Atual
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </aside>

          {/* Right — floor plan canvas */}
          <div className="relative flex min-w-0 flex-1 flex-col">
            {/* Legend */}
            <div className="absolute left-4 top-4 z-20 flex items-center gap-4 select-none">
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full border border-[#d4d4d4] bg-white" />
                <span className="text-[11px] font-medium text-[#737373]">Disponível</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full border border-[#d4d4d4]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(-45deg, #d4d4d4 0 1px, transparent 1px 3px)',
                    backgroundColor: '#f5f5f5',
                  }}
                />
                <span className="text-[11px] font-medium text-[#737373]">Em uso</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-[#171717]" />
                <span className="text-[11px] font-medium text-[#737373]">Selecionada</span>
              </div>
            </div>

            {filteredFloorTables.length === 0 ? (
              <div className="flex flex-1 items-center justify-center select-none">
                <div className="text-center">
                  <p className="text-base font-bold text-[#171717]">Nenhuma mesa encontrada</p>
                  <p className="mt-1 text-sm text-[#737373]">Ajuste a busca para ver as mesas.</p>
                </div>
              </div>
            ) : (
              <div
                className="relative min-h-0 flex-1 m-3 mt-10 rounded-xl bg-[#fafafa]"
                style={{
                  backgroundImage: DOT_GRID,
                  backgroundSize: '16px 16px',
                }}
              >
                {/* Fixtures */}
                {visibleFixtures.map((fixture) => {
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

                {/* Table shapes */}
                {filteredFloorTables.map((table) => {
                  const isSelected = table.id === selectedFloorTableId;
                  const effectiveStatus = getEffectiveStatus(table);
                  const isOccupied = effectiveStatus === 'occupied';
                  const labelNumber = table.name.replace(/^Mesa\s+/i, '');
                  const rotationDeg = table.rotationDeg ?? 0;

                  const shapeRadius =
                    table.shape === 'circle'
                      ? 'rounded-full'
                      : table.shape === 'square'
                        ? 'rounded-xl'
                        : 'rounded-2xl';

                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => handleSelect(table)}
                      className={cn(
                        'absolute flex items-center justify-center border-2 bg-white text-sm font-semibold text-[#171717] transition-shadow cursor-pointer select-none',
                        shapeRadius,
                        isSelected
                          ? 'border-primary shadow-[0_0_0_3px_rgba(23,23,23,0.15)]'
                          : 'border-[#d4d4d4] hover:border-[#a3a3a3]',
                      )}
                      style={{
                        left: `${table.x}%`,
                        top: `${table.y}%`,
                        width: `${table.w}%`,
                        height: `${table.h}%`,
                        backgroundColor: isSelected
                          ? 'var(--primary)'
                          : isOccupied
                            ? '#f5f5f5'
                            : '#ffffff',
                        backgroundImage: !isSelected && isOccupied ? OCCUPIED_HATCH : undefined,
                        color: isSelected ? 'var(--primary-foreground)' : '#171717',
                        transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
                        transformOrigin: 'center center',
                      }}
                      aria-label={table.name}
                      aria-pressed={isSelected}
                    >
                      <span
                        className="relative z-10"
                        style={{
                          transform: rotationDeg
                            ? `rotate(-${rotationDeg}deg)`
                            : undefined,
                        }}
                      >
                        {labelNumber}
                      </span>
                      {/* Capacity badge */}
                      <span
                        className={cn(
                          'absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white',
                          isSelected ? 'bg-white text-primary' : 'bg-[#171717]',
                        )}
                        style={{
                          transform: rotationDeg
                            ? `rotate(-${rotationDeg}deg)`
                            : undefined,
                        }}
                      >
                        {table.capacity}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer — confirm or cancel */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#E5E5E5] bg-white px-6 py-4">
          <div className="min-w-0 flex-1">
            {selectedFloorTable && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-[#171717]">
                  {selectedFloorTable.name}
                </span>
                <span className="text-[#737373]">·</span>
                <span className="text-[#737373]">
                  {selectedFloorTable.capacity} lugares
                </span>
                <span className="text-[#737373]">·</span>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    getEffectiveStatus(selectedFloorTable) === 'occupied'
                      ? 'text-red-600'
                      : getEffectiveStatus(selectedFloorTable) === 'reserved'
                        ? 'text-amber-600'
                        : 'text-emerald-600',
                  )}
                >
                  {getEffectiveStatus(selectedFloorTable) === 'occupied'
                    ? 'Ocupada'
                    : getEffectiveStatus(selectedFloorTable) === 'reserved'
                      ? 'Reservada'
                      : 'Disponível'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="pdv-gradient-border-btn flex h-11 items-center justify-center rounded-lg px-6 text-sm font-semibold text-[#171717] cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selectedFloorTableId}
              className="pdv-primary-gradient-btn flex h-11 items-center justify-center rounded-lg px-6 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              onClick={handleConfirm}
            >
              Confirmar Mesa
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
