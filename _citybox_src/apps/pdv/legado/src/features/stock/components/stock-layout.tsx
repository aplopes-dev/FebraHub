'use client';

import { useMemo, useState } from 'react';
import {
  SearchIcon,
  ArrowUpDownIcon,
  SlidersHorizontalIcon,
  MoreVerticalIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  XIcon,
  ImageIcon,
  BoxesIcon,
  HistoryIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@citybox/ui';
import {
  Input,
  ScrollArea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@citybox/ui/atoms';
import { useToast } from '@/components/toast';
import { formatCatalogPrice } from '@/features/pos/data/placeholder-catalog-products';
import { useProductsStore } from '@/features/products/hooks/use-products-store';
import { useStockStore } from '../hooks/use-stock-store';
import {
  isStockFiltersActive,
  StockFiltersModal,
} from './stock-filters-modal';
import type { StockFilters } from '../types/stock';
import {
  DEFAULT_STOCK_FILTERS,
  STOCK_MOVEMENT_LABEL,
  STOCK_MOVEMENT_PILL_CLASS,
  STOCK_REASON_LABEL,
} from '../types/stock';
import { INITIAL_STOCK_ITEMS } from '../data/mock-stock';
import type { StockItemData, StockItemType } from '../types/stock';
import { StockEntryModal } from './stock-entry-modal';
import { StockExitModal } from './stock-exit-modal';

type CombinedStockItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  itemType: StockItemType;
  imageUrl?: string | null;
  stock: number;
  minStock: number;
  unit: string;
  priceCents: number;
  usedInProducts?: string[];
};

const ITEM_TYPE_LABEL: Record<StockItemType, string> = {
  retail: 'Revenda Direta',
  ingredient: 'Insumo / Ingrediente',
  prepared: 'Receita (Cozinha)',
};

const ITEM_TYPE_PILL_CLASS: Record<StockItemType, string> = {
  retail: 'bg-blue-50 text-blue-700 border border-blue-200',
  ingredient: 'bg-purple-50 text-purple-700 border border-purple-200',
  prepared: 'bg-[#171717]/5 text-[#171717] border border-[#171717]/20 font-bold',
};

type SortOption = 'stock_asc' | 'stock_desc' | 'name_asc' | 'name_desc' | 'date_desc';

type SortOptionConfig = {
  id: SortOption;
  label: string;
};

const SORT_OPTIONS: readonly SortOptionConfig[] = [
  { id: 'stock_asc', label: 'Estoque (Menor primeiro)' },
  { id: 'stock_desc', label: 'Estoque (Maior primeiro)' },
  { id: 'name_asc', label: 'Nome (A-Z)' },
  { id: 'name_desc', label: 'Nome (Z-A)' },
  { id: 'date_desc', label: 'Mais recentes' },
] as const;

const CURRENT_GRID_COLS = 'grid-cols-[100px_1fr_140px_120px_110px_120px_40px]';
const HISTORY_GRID_COLS = 'grid-cols-[100px_140px_1fr_120px_100px_160px_130px]';

export function StockLayout() {
  const products = useProductsStore((state) => state.products);
  const movements = useStockStore((state) => state.movements);
  const getMinStock = useStockStore((state) => state.getMinStock);
  const getUnit = useStockStore((state) => state.getUnit);
  const getStockStatus = useStockStore((state) => state.getStockStatus);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('stock_asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<StockFilters>(DEFAULT_STOCK_FILTERS);
  const [draftFilters, setDraftFilters] = useState<StockFilters>(DEFAULT_STOCK_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [selectedProductIdForModal, setSelectedProductIdForModal] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const categoryOptions = useMemo(() => {
    const fromData = products.map((p) => p.category);
    return Array.from(new Set(fromData)).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Estatísticas do topo
  const totalStockItems = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  const totalStockValueCents = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.priceCents, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => getStockStatus(p.stock, getMinStock(p.id)) === 'low_stock').length;
  }, [products, getStockStatus, getMinStock]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stock === 0).length;
  }, [products]);

  // Lista combinada de Produtos Prontos, Insumos/Ingredientes e Receitas
  const allStockItems: CombinedStockItem[] = useMemo(() => {
    const productItems: CombinedStockItem[] = products.map((p) => {
      const mockMeta = INITIAL_STOCK_ITEMS.find((item) => item.productId === p.id);
      return {
        id: p.id,
        sku: p.id,
        name: p.name,
        category: p.category,
        itemType: mockMeta?.itemType || (p.category === 'Bebidas' ? 'retail' : 'prepared'),
        imageUrl: p.imageUrl,
        stock: p.stock,
        minStock: getMinStock(p.id),
        unit: getUnit(p.id),
        priceCents: p.priceCents,
        usedInProducts: mockMeta?.usedInProducts,
      };
    });

    const extraIngredients: CombinedStockItem[] = INITIAL_STOCK_ITEMS.filter(
      (item) => item.itemType === 'ingredient' && !products.some((p) => p.id === item.productId),
    ).map((item) => ({
      id: item.productId,
      sku: item.sku,
      name: item.name,
      category: item.category,
      itemType: item.itemType,
      imageUrl: item.imageUrl,
      stock: item.currentStock,
      minStock: item.minStock,
      unit: item.unit,
      priceCents: item.costPriceCents,
      usedInProducts: item.usedInProducts,
    }));

    return [...productItems, ...extraIngredients];
  }, [products, getMinStock, getUnit]);

  // Lista de Estoque Atual Filtrada e Ordenada
  const filteredCurrentStock = useMemo(() => {
    let result = [...allStockItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.usedInProducts && p.usedInProducts.some((u) => u.toLowerCase().includes(q))),
      );
    }

    if (appliedFilters.itemType !== 'all') {
      result = result.filter((p) => p.itemType === appliedFilters.itemType);
    }

    if (appliedFilters.category !== 'all') {
      result = result.filter((p) => p.category === appliedFilters.category);
    }

    if (appliedFilters.stockLevel !== 'all') {
      result = result.filter(
        (p) => getStockStatus(p.stock, p.minStock) === appliedFilters.stockLevel,
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'stock_desc':
          return b.stock - a.stock;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'stock_asc':
        default:
          return a.stock - b.stock;
      }
    });

    return result;
  }, [allStockItems, searchQuery, appliedFilters, sortBy, getStockStatus]);

  // Lista de Histórico Filtrado e Ordenado
  const filteredMovements = useMemo(() => {
    let result = [...movements];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.productName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.operator.toLowerCase().includes(q),
      );
    }

    if (appliedFilters.movementType !== 'all') {
      result = result.filter((m) => m.type === appliedFilters.movementType);
    }

    return result;
  }, [movements, searchQuery, appliedFilters]);

  const currentListLength =
    activeTab === 'current' ? filteredCurrentStock.length : filteredMovements.length;

  const totalPages = Math.max(1, Math.ceil(currentListLength / itemsPerPage));

  const paginatedCurrentStock = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCurrentStock.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCurrentStock, currentPage, itemsPerPage]);

  const paginatedMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMovements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMovements, currentPage, itemsPerPage]);

  const activePills: { key: string; label: string; onRemove: () => void }[] = [];

  if (appliedFilters.stockLevel !== 'all') {
    const labelMap: Record<string, string> = {
      in_stock: 'Em estoque',
      low_stock: 'Estoque baixo',
      out_of_stock: 'Sem estoque',
    };
    activePills.push({
      key: 'stockLevel',
      label: `Status: ${labelMap[appliedFilters.stockLevel]}`,
      onRemove: () => {
        setAppliedFilters((prev: StockFilters) => ({ ...prev, stockLevel: 'all' }));
        setDraftFilters((prev: StockFilters) => ({ ...prev, stockLevel: 'all' }));
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.category !== 'all') {
    activePills.push({
      key: 'category',
      label: `Categoria: ${appliedFilters.category}`,
      onRemove: () => {
        setAppliedFilters((prev: StockFilters) => ({ ...prev, category: 'all' }));
        setDraftFilters((prev: StockFilters) => ({ ...prev, category: 'all' }));
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.movementType !== 'all') {
    const movementLabelMap: Record<string, string> = {
      entry: 'Entrada',
      exit: 'Saída',
      sale: 'Venda PDV',
      adjustment: 'Ajuste',
    };
    activePills.push({
      key: 'movementType',
      label: `Movimentação: ${movementLabelMap[appliedFilters.movementType]}`,
      onRemove: () => {
        setAppliedFilters((prev: StockFilters) => ({ ...prev, movementType: 'all' }));
        setDraftFilters((prev: StockFilters) => ({ ...prev, movementType: 'all' }));
        setCurrentPage(1);
      },
    });
  }

  const handleOpenEntryModal = (productId?: string) => {
    setSelectedProductIdForModal(productId || null);
    setIsEntryModalOpen(true);
  };

  const handleOpenExitModal = (productId?: string) => {
    setSelectedProductIdForModal(productId || null);
    setIsExitModalOpen(true);
  };

  const handleViewProductHistory = (sku: string) => {
    setActiveTab('history');
    setSearchQuery(sku);
    setCurrentPage(1);
  };

  const hasActiveFilter = isStockFiltersActive(appliedFilters);

  return (
    <div className="flex h-full min-h-0 flex-col p-6 gap-5 bg-[#F7F7F7] select-none">
      {/* SUMMARY KPI CARDS DE ESTOQUE */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        {/* Total de Itens */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#171717] text-white shadow-xs">
              <BoxesIcon className="size-5" />
            </div>
            <span className="text-xs font-semibold text-[#525252]">Total de Itens</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-extrabold tracking-tight text-[#171717]">
              {totalStockItems.toLocaleString('pt-BR')} un
            </span>
            <span className="text-xs font-semibold text-[#737373]">{products.length} produtos</span>
          </div>
        </div>

        {/* Valor Total do Estoque */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#171717] text-white shadow-xs">
              <ArrowDownCircleIcon className="size-5" />
            </div>
            <span className="text-xs font-semibold text-[#525252]">Valor Total do Estoque</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-extrabold tracking-tight text-[#171717]">
              {formatCatalogPrice(totalStockValueCents)}
            </span>
            <span className="text-xs font-semibold text-[#737373]">Preço de venda</span>
          </div>
        </div>

        {/* Produtos com Estoque Baixo */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
              <AlertTriangleIcon className="size-5" />
            </div>
            <span className="text-xs font-semibold text-[#525252]">Estoque Baixo</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-extrabold tracking-tight text-[#171717]">
              {lowStockCount} {lowStockCount === 1 ? 'item' : 'itens'}
            </span>
            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
              Atenção ⚠️
            </span>
          </div>
        </div>

        {/* Produtos Sem Estoque */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs">
              <XIcon className="size-5" />
            </div>
            <span className="text-xs font-semibold text-[#525252]">Sem Estoque</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl font-extrabold tracking-tight text-[#171717]">
              {outOfStockCount} {outOfStockCount === 1 ? 'item' : 'itens'}
            </span>
            <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
              Esgotado 🔴
            </span>
          </div>
        </div>
      </div>

      {/* CONTAINER PRINCIPAL (Identico à tela de Produtos) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-xs">
        {/* BARRA SUPERIOR DE AÇÕES E NAVEGAÇÃO */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e5e5] px-6 py-4">
          {/* Alternador de Abas */}
          <div className="flex items-center gap-2 rounded-xl bg-[#F5F5F5] p-1 border border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('current');
                setCurrentPage(1);
              }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer',
                activeTab === 'current'
                  ? 'bg-white text-[#171717] shadow-xs font-bold'
                  : 'text-[#737373] hover:text-[#171717]',
              )}
            >
              <BoxesIcon className="size-4" />
              <span>Estoque Atual</span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-bold text-[#171717]">
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setCurrentPage(1);
              }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer',
                activeTab === 'history'
                  ? 'bg-white text-[#171717] shadow-xs font-bold'
                  : 'text-[#737373] hover:text-[#171717]',
              )}
            >
              <HistoryIcon className="size-4" />
              <span>Histórico de Movimentações</span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-bold text-[#171717]">
                {movements.length}
              </span>
            </button>
          </div>

          {/* Ferramentas: Busca, Ordenar, Filtrar e Botões de Entrada/Saída */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#737373]" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  activeTab === 'current'
                    ? 'Buscar produto no estoque...'
                    : 'Buscar movimentação por produto...'
                }
                className="h-10 w-[280px] rounded-xl border-[#e5e5e5] bg-white text-sm focus:border-primary !pl-10 !pr-4"
              />
            </div>

            <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-[#e5e5e5] bg-white px-3.5 text-sm font-semibold text-[#171717] hover:bg-black/[0.02] cursor-pointer"
                >
                  <ArrowUpDownIcon className="size-4 text-[#737373]" />
                  <span>Ordenar</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 flex-col gap-1 p-1.5">
                {SORT_OPTIONS.map((option) => {
                  const isActive = option.id === sortBy;
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
                        setSortBy(option.id);
                        setCurrentPage(1);
                        setIsSortOpen(false);
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
              onClick={() => {
                setDraftFilters(appliedFilters);
                setIsFiltersOpen(true);
              }}
              className={cn(
                'flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold cursor-pointer',
                hasActiveFilter
                  ? 'border-primary/20 bg-primary/5 text-primary'
                  : 'border-[#e5e5e5] bg-white text-[#171717] hover:bg-black/[0.02]',
              )}
            >
              <SlidersHorizontalIcon className="size-4 text-[#737373]" />
              <span>Filtrar</span>
            </button>

            {/* CTA Entrada de Estoque */}
            <button
              type="button"
              onClick={() => handleOpenEntryModal()}
              className="pdv-primary-gradient-btn flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            >
              <PlusIcon className="size-4" />
              <span>Entrada</span>
            </button>

            {/* CTA Saída de Estoque */}
            <button
              type="button"
              onClick={() => handleOpenExitModal()}
              className="pdv-gradient-border-btn flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-[#171717] cursor-pointer"
            >
              <MinusIcon className="size-4" />
              <span>Saída / Ajuste</span>
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS ATIVOS */}
        {activePills.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#e5e5e5] px-6 py-3">
            {activePills.map((pill) => (
              <span
                key={pill.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 py-1.5 pl-3 pr-1.5 text-xs font-semibold text-primary select-none"
              >
                {pill.label}
                <button
                  type="button"
                  aria-label={`Remover filtro: ${pill.label}`}
                  onClick={pill.onRemove}
                  className="flex size-4 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/15 hover:text-primary cursor-pointer"
                >
                  <XIcon className="size-3" strokeWidth={2.5} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                setSortBy('stock_asc');
                setAppliedFilters(DEFAULT_STOCK_FILTERS);
                setDraftFilters(DEFAULT_STOCK_FILTERS);
                setCurrentPage(1);
              }}
              className="ml-1 text-xs font-semibold text-[#737373] transition-colors hover:text-[#171717] hover:underline cursor-pointer"
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* SUB-ABAS ANALÍTICAS DE TIPO DE ITEM (Revenda vs Insumos vs Receitas) */}
        {activeTab === 'current' && (
          <div className="flex items-center gap-2 border-b border-[#e5e5e5] px-6 py-2.5 bg-[#FAFAFA]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373] mr-2">
              Visão:
            </span>
            {[
              { id: 'all', label: 'Todos os Itens' },
              { id: 'retail', label: 'Revenda Direta 🥤' },
              { id: 'ingredient', label: 'Insumos / Ingredientes 🥩' },
              { id: 'prepared', label: 'Produtos Preparados 🍔' },
            ].map((subTab) => {
              const isActive = appliedFilters.itemType === subTab.id;
              return (
                <button
                  key={subTab.id}
                  type="button"
                  onClick={() => {
                    setAppliedFilters((prev: StockFilters) => ({
                      ...prev,
                      itemType: subTab.id as StockFilters['itemType'],
                    }));
                    setDraftFilters((prev: StockFilters) => ({
                      ...prev,
                      itemType: subTab.id as StockFilters['itemType'],
                    }));
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'rounded-xl px-3 py-1 text-xs font-semibold cursor-pointer transition-all',
                    isActive
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : 'bg-white border border-[#E5E5E5] text-[#525252] hover:bg-black/[0.03]',
                  )}
                >
                  {subTab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* CONTEÚDO DA TAB 1: ESTOQUE ATUAL */}
        {activeTab === 'current' && (
          <>
            <div
              className={cn(
                'grid shrink-0 items-center border-b border-[#e5e5e5] bg-[#f9f9f9] px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a3a3a3] select-none',
                CURRENT_GRID_COLS,
              )}
            >
              <div className="flex h-4 items-center border-r border-[#e5e5e5] pr-4">SKU / ID</div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">
                Nome do produto / insumo
              </div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">Categoria</div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">Qtd. Estoque</div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">Est. Mínimo</div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">Status</div>
              <div />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredCurrentStock.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center select-none">
                  <div className="relative mb-4 flex size-20 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#EAEAEA]/40 shadow-inner">
                    <BoxesIcon className="size-10 text-[#A3A3A3]" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-[#171717]">Nenhum item em estoque</h3>
                  <p className="text-sm font-medium text-[#737373]">
                    Altere os filtros ou adicione uma nova entrada para visualizar os itens.
                  </p>
                </div>
              ) : (
                <ScrollArea type="scroll" className="h-full">
                  <div className="divide-y divide-[#e5e5e5]">
                    {paginatedCurrentStock.map((prod) => {
                      const minStock = prod.minStock;
                      const unit = prod.unit;
                      const status = getStockStatus(prod.stock, minStock);

                      const statusPill =
                        status === 'out_of_stock' ? (
                          <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            Sem estoque 🔴
                          </span>
                        ) : status === 'low_stock' ? (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Estoque baixo ⚠️
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Em estoque 🟢
                          </span>
                        );

                      return (
                        <div
                          key={prod.id}
                          className={cn(
                            'grid w-full items-center border-b border-[#e5e5e5] bg-transparent px-6 py-3.5 text-left text-sm text-[#171717] transition-colors hover:bg-black/[0.015]',
                            CURRENT_GRID_COLS,
                          )}
                        >
                          <div className="truncate font-bold text-[#171717]">{prod.id}</div>
                          <div className="min-w-0 px-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-[#e5e5e5] bg-[#fafafa]">
                                {prod.imageUrl ? (
                                  <Image
                                    src={prod.imageUrl}
                                    alt=""
                                    fill
                                    unoptimized
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <span className="flex size-full items-center justify-center text-[#d4d4d4]">
                                    <ImageIcon className="size-4" strokeWidth={1.5} />
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="truncate font-semibold text-[#171717]">
                                    {prod.name}
                                  </span>
                                  <span
                                    className={cn(
                                      'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold',
                                      ITEM_TYPE_PILL_CLASS[prod.itemType],
                                    )}
                                  >
                                    {ITEM_TYPE_LABEL[prod.itemType]}
                                  </span>
                                </div>
                                {prod.usedInProducts && prod.usedInProducts.length > 0 ? (
                                  <p className="truncate text-xs text-purple-700 font-medium mt-0.5">
                                    Usado em: {prod.usedInProducts.join(', ')}
                                  </p>
                                ) : (
                                  <p className="truncate text-xs text-[#737373] font-normal">
                                    {formatCatalogPrice(prod.priceCents)} cada
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="truncate px-4 text-[#525252] font-medium">{prod.category}</div>
                          <div className="truncate px-4 font-bold text-[#171717]">
                            {prod.stock} {unit}
                          </div>
                          <div className="truncate px-4 font-medium text-[#737373]">
                            {minStock} {unit}
                          </div>
                          <div className="px-4">{statusPill}</div>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="Ações de Estoque"
                                  className="flex size-8 items-center justify-center rounded-lg text-[#737373] transition-colors hover:bg-black/[0.05] hover:text-[#171717] cursor-pointer"
                                >
                                  <MoreVerticalIcon className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleOpenEntryModal(prod.id)}>
                                  <PlusIcon className="size-4 text-emerald-600" />
                                  Nova Entrada
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenExitModal(prod.id)}>
                                  <MinusIcon className="size-4 text-rose-600" />
                                  Registrar Saída
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleViewProductHistory(prod.id)}
                                >
                                  <HistoryIcon className="size-4" />
                                  Ver Histórico
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </>
        )}

        {/* CONTEÚDO DA TAB 2: HISTÓRICO DE MOVIMENTAÇÕES */}
        {activeTab === 'history' && (
          <>
            <div
              className={cn(
                'grid shrink-0 items-center border-b border-[#e5e5e5] bg-[#f9f9f9] px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a3a3a3] select-none',
                HISTORY_GRID_COLS,
              )}
            >
              <div className="flex h-4 items-center border-r border-[#e5e5e5] pr-4">ID MOV</div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">DATA / HORA</div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">PRODUTO</div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">TIPO</div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">QUANTIDADE</div>
              <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">
                MOTIVO / ORIGEM
              </div>
              <div className="flex h-4 items-center px-4">OPERADOR</div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredMovements.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center select-none">
                  <HistoryIcon className="size-10 text-[#A3A3A3] mb-3" />
                  <h3 className="mb-1 text-lg font-bold text-[#171717]">
                    Nenhuma movimentação encontrada
                  </h3>
                  <p className="text-sm font-medium text-[#737373]">
                    Altere os filtros de movimentação ou realize uma entrada/saída.
                  </p>
                </div>
              ) : (
                <ScrollArea type="scroll" className="h-full">
                  <div className="divide-y divide-[#e5e5e5]">
                    {paginatedMovements.map((mov) => {
                      const isEntry = mov.type === 'entry';
                      const isExit = mov.type === 'exit';

                      return (
                        <div
                          key={mov.id}
                          className={cn(
                            'grid w-full items-center border-b border-[#e5e5e5] bg-transparent px-6 py-3.5 text-left text-sm text-[#171717] transition-colors hover:bg-black/[0.015]',
                            HISTORY_GRID_COLS,
                          )}
                        >
                          <div className="truncate font-bold text-[#171717]">{mov.id}</div>
                          <div className="truncate px-4 font-medium text-[#525252]">
                            {mov.date}
                          </div>
                          <div className="min-w-0 px-4">
                            <span className="truncate font-semibold text-[#171717] block">
                              {mov.productName}
                            </span>
                            <span className="text-xs text-[#737373] font-mono">{mov.sku}</span>
                          </div>
                          <div className="px-4">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                STOCK_MOVEMENT_PILL_CLASS[mov.type],
                              )}
                            >
                              {STOCK_MOVEMENT_LABEL[mov.type]}
                            </span>
                          </div>
                          <div className="px-4 font-extrabold text-sm">
                            {isEntry ? (
                              <span className="text-emerald-600">+{mov.quantity}</span>
                            ) : isExit ? (
                              <span className="text-rose-600">-{mov.quantity}</span>
                            ) : (
                              <span className="text-[#171717]">{mov.quantity}</span>
                            )}
                          </div>
                          <div className="truncate px-4 font-medium text-[#525252]">
                            {STOCK_REASON_LABEL[mov.reason] || mov.reasonLabel}
                          </div>
                          <div className="truncate px-4 text-xs font-medium text-[#737373]">
                            {mov.operator}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </>
        )}

        {/* RODAPÉ E PAGINAÇÃO */}
        {currentListLength > 0 && (
          <div className="flex shrink-0 items-center justify-between border-t border-[#e5e5e5] px-6 py-3 text-sm text-[#737373] select-none">
            <span>
              {currentListLength} registro{currentListLength === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-lg px-3 py-1.5 font-semibold text-[#171717] hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                Anterior
              </button>
              <span className="tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="rounded-lg px-3 py-1.5 font-semibold text-[#171717] hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAIS DE ENTRADA, SAÍDA E FILTROS */}
      <StockEntryModal
        open={isEntryModalOpen}
        onOpenChange={setIsEntryModalOpen}
        initialProductId={selectedProductIdForModal}
      />

      <StockExitModal
        open={isExitModalOpen}
        onOpenChange={setIsExitModalOpen}
        initialProductId={selectedProductIdForModal}
      />

      <StockFiltersModal
        open={isFiltersOpen}
        onOpenChange={(open) => {
          if (open) setDraftFilters(appliedFilters);
          setIsFiltersOpen(open);
        }}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        categories={categoryOptions}
        onCancel={() => setIsFiltersOpen(false)}
        onApply={() => {
          setAppliedFilters(draftFilters);
          setIsFiltersOpen(false);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
