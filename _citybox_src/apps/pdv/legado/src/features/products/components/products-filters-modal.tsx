'use client';

import { useState } from 'react';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import { CurrencyInput } from '@citybox/ui/molecules';
import { PRODUCT_STATUS_LABEL, type ProductStatus } from '../types/product';

export type ProductStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export type ProductsFilters = {
  status: 'all' | ProductStatus;
  category: 'all' | string;
  minPrice: number;
  maxPrice: number;
  stock: ProductStockFilter;
};

export const DEFAULT_PRODUCTS_FILTERS: ProductsFilters = {
  status: 'all',
  category: 'all',
  minPrice: 0,
  maxPrice: 0,
  stock: 'all',
};

const STATUS_OPTIONS: readonly { id: ProductsFilters['status']; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: PRODUCT_STATUS_LABEL.active },
  { id: 'inactive', label: PRODUCT_STATUS_LABEL.inactive },
  { id: 'draft', label: PRODUCT_STATUS_LABEL.draft },
] as const;

const STOCK_OPTIONS: readonly { id: ProductStockFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'in_stock', label: 'Em estoque' },
  { id: 'low_stock', label: 'Estoque baixo' },
  { id: 'out_of_stock', label: 'Sem estoque' },
] as const;

type ProductsFiltersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ProductsFilters;
  onDraftChange: (next: ProductsFilters) => void;
  categories: readonly string[];
  onCancel: () => void;
  onApply: () => void;
};

export function ProductsFiltersModal({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  categories,
  onCancel,
  onApply,
}: ProductsFiltersModalProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);

  const statusLabel =
    STATUS_OPTIONS.find((option) => option.id === draft.status)?.label ?? 'Todos';
  const categoryLabel = draft.category === 'all' ? 'Todas' : draft.category;
  const stockLabel = STOCK_OPTIONS.find((option) => option.id === draft.stock)?.label ?? 'Todos';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-full max-w-[440px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[440px]">
        <DialogTitle className="sr-only">Filtros</DialogTitle>

        <div className="flex shrink-0 items-center justify-center bg-[#E5E5E5] px-8 py-5 text-[#171717]">
          <h2 className="text-xl font-bold tracking-tight">Filtros</h2>
        </div>

        <div className="flex flex-col gap-5 bg-[#F7F7F7] px-8 py-6 text-[#171717]">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#171717]">Status</span>
            <DropdownMenu open={isStatusOpen} onOpenChange={setIsStatusOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E5E5E5] bg-white px-4 text-base font-normal text-[#171717] hover:bg-black/[0.01] cursor-pointer"
                >
                  <span>{statusLabel}</span>
                  <ChevronDownIcon className="size-4 text-[#737373]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => onDraftChange({ ...draft, status: option.id })}
                  >
                    <span className="flex-1">{option.label}</span>
                    {draft.status === option.id && (
                      <CheckIcon className="size-4" strokeWidth={2.5} />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#171717]">Categoria</span>
            <DropdownMenu open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E5E5E5] bg-white px-4 text-base font-normal text-[#171717] hover:bg-black/[0.01] cursor-pointer"
                >
                  <span>{categoryLabel}</span>
                  <ChevronDownIcon className="size-4 text-[#737373]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuItem onClick={() => onDraftChange({ ...draft, category: 'all' })}>
                  <span className="flex-1">Todas</span>
                  {draft.category === 'all' && <CheckIcon className="size-4" strokeWidth={2.5} />}
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => onDraftChange({ ...draft, category })}
                  >
                    <span className="flex-1">{category}</span>
                    {draft.category === category && (
                      <CheckIcon className="size-4" strokeWidth={2.5} />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#171717]">Preço mínimo</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
                  R$
                </span>
                <CurrencyInput
                  value={draft.minPrice}
                  onValueChange={(value) => onDraftChange({ ...draft, minPrice: value })}
                  className="h-12 rounded-xl border-[#E5E5E5] bg-white text-base focus:border-primary !pl-10 !pr-4"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#171717]">Preço máximo</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
                  R$
                </span>
                <CurrencyInput
                  value={draft.maxPrice}
                  onValueChange={(value) => onDraftChange({ ...draft, maxPrice: value })}
                  className="h-12 rounded-xl border-[#E5E5E5] bg-white text-base focus:border-primary !pl-10 !pr-4"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#171717]">Estoque</span>
            <DropdownMenu open={isStockOpen} onOpenChange={setIsStockOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E5E5E5] bg-white px-4 text-base font-normal text-[#171717] hover:bg-black/[0.01] cursor-pointer"
                >
                  <span>{stockLabel}</span>
                  <ChevronDownIcon className="size-4 text-[#737373]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {STOCK_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => onDraftChange({ ...draft, stock: option.id })}
                  >
                    <span className="flex-1">{option.label}</span>
                    {draft.stock === option.id && (
                      <CheckIcon className="size-4" strokeWidth={2.5} />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#E5E5E5] bg-white px-8 py-4">
          <button
            type="button"
            className="pdv-gradient-border-btn flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold text-[#171717] cursor-pointer"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="pdv-primary-gradient-btn flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
            onClick={onApply}
          >
            Aplicar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function isProductsFiltersActive(filters: ProductsFilters): boolean {
  return (
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.minPrice > 0 ||
    filters.maxPrice > 0 ||
    filters.stock !== 'all'
  );
}

export function matchesProductStock(stock: number, filter: ProductStockFilter): boolean {
  switch (filter) {
    case 'in_stock':
      return stock > 0;
    case 'low_stock':
      return stock > 0 && stock <= 10;
    case 'out_of_stock':
      return stock === 0;
    case 'all':
    default:
      return true;
  }
}
