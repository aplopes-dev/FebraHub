'use client';

import { useMemo, useState } from 'react';
import {
  SearchIcon,
  ArrowUpDownIcon,
  SlidersHorizontalIcon,
  MoreVerticalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  CheckIcon,
  PlusIcon,
  XIcon,
  ImageIcon,
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
import { PdvDeleteModal } from '@/components/pdv-delete-modal';
import { formatCatalogPrice } from '@/features/pos/data/placeholder-catalog-products';
import { PRODUCT_CATEGORIES } from '../data/placeholder-products';
import { useProductsStore } from '../hooks/use-products-store';
import {
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_PILL_CLASS,
  type PdvProduct,
} from '../types/product';
import {
  DEFAULT_PRODUCTS_FILTERS,
  isProductsFiltersActive,
  matchesProductStock,
  ProductsFiltersModal,
  type ProductsFilters,
} from './products-filters-modal';
import { ProductFormModal } from './product-form-modal';

type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_desc';

type SortOptionConfig = {
  id: SortOption;
  label: string;
};

const SORT_OPTIONS: readonly SortOptionConfig[] = [
  { id: 'name_asc', label: 'Nome (A-Z)' },
  { id: 'name_desc', label: 'Nome (Z-A)' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
  { id: 'stock_desc', label: 'Maior estoque' },
] as const;

const STOCK_FILTER_LABEL: Record<ProductsFilters['stock'], string> = {
  all: 'Todos',
  in_stock: 'Em estoque',
  low_stock: 'Estoque baixo',
  out_of_stock: 'Sem estoque',
};

const GRID_COLS = 'grid-cols-[100px_1fr_160px_100px_120px_120px_40px]';

export function ProductsLayout() {
  const products = useProductsStore((state) => state.products);
  const deleteProduct = useProductsStore((state) => state.deleteProduct);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ProductsFilters>(DEFAULT_PRODUCTS_FILTERS);
  const [draftFilters, setDraftFilters] = useState<ProductsFilters>(DEFAULT_PRODUCTS_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PdvProduct | null>(null);
  const [productPendingDelete, setProductPendingDelete] = useState<PdvProduct | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const categoryOptions = useMemo(() => {
    const fromData = products.map((product) => product.category);
    return Array.from(new Set([...PRODUCT_CATEGORIES, ...fromData])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.id.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q),
      );
    }

    if (appliedFilters.category !== 'all') {
      result = result.filter((product) => product.category === appliedFilters.category);
    }

    if (appliedFilters.status !== 'all') {
      result = result.filter((product) => product.status === appliedFilters.status);
    }

    if (appliedFilters.minPrice > 0) {
      const minPriceCents = Math.round(appliedFilters.minPrice * 100);
      result = result.filter((product) => product.priceCents >= minPriceCents);
    }

    if (appliedFilters.maxPrice > 0) {
      const maxPriceCents = Math.round(appliedFilters.maxPrice * 100);
      result = result.filter((product) => product.priceCents <= maxPriceCents);
    }

    if (appliedFilters.stock !== 'all') {
      result = result.filter((product) =>
        matchesProductStock(product.stock, appliedFilters.stock),
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'price_asc':
          return a.priceCents - b.priceCents;
        case 'price_desc':
          return b.priceCents - a.priceCents;
        case 'stock_desc':
          return b.stock - a.stock;
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [products, searchQuery, appliedFilters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProducts.length / itemsPerPage));

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const activePills: { key: string; label: string; onRemove: () => void }[] = [];

  if (sortBy !== 'name_asc') {
    const sortOption = SORT_OPTIONS.find((option) => option.id === sortBy);
    activePills.push({
      key: 'sort',
      label: `Ordenar: ${sortOption?.label ?? ''}`,
      onRemove: () => {
        setSortBy('name_asc');
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.status !== 'all') {
    activePills.push({
      key: 'status',
      label: `Status: ${PRODUCT_STATUS_LABEL[appliedFilters.status]}`,
      onRemove: () => {
        setAppliedFilters((prev) => ({ ...prev, status: 'all' }));
        setDraftFilters((prev) => ({ ...prev, status: 'all' }));
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.category !== 'all') {
    activePills.push({
      key: 'category',
      label: `Categoria: ${appliedFilters.category}`,
      onRemove: () => {
        setAppliedFilters((prev) => ({ ...prev, category: 'all' }));
        setDraftFilters((prev) => ({ ...prev, category: 'all' }));
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.minPrice > 0) {
    activePills.push({
      key: 'minPrice',
      label: `Mínimo: ${formatCatalogPrice(Math.round(appliedFilters.minPrice * 100))}`,
      onRemove: () => {
        setAppliedFilters((prev) => ({ ...prev, minPrice: 0 }));
        setDraftFilters((prev) => ({ ...prev, minPrice: 0 }));
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.maxPrice > 0) {
    activePills.push({
      key: 'maxPrice',
      label: `Máximo: ${formatCatalogPrice(Math.round(appliedFilters.maxPrice * 100))}`,
      onRemove: () => {
        setAppliedFilters((prev) => ({ ...prev, maxPrice: 0 }));
        setDraftFilters((prev) => ({ ...prev, maxPrice: 0 }));
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.stock !== 'all') {
    activePills.push({
      key: 'stock',
      label: `Estoque: ${STOCK_FILTER_LABEL[appliedFilters.stock]}`,
      onRemove: () => {
        setAppliedFilters((prev) => ({ ...prev, stock: 'all' }));
        setDraftFilters((prev) => ({ ...prev, stock: 'all' }));
        setCurrentPage(1);
      },
    });
  }

  const handleOpenFilters = () => {
    setDraftFilters(appliedFilters);
    setIsFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setIsFiltersOpen(false);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSortBy('name_asc');
    setAppliedFilters(DEFAULT_PRODUCTS_FILTERS);
    setDraftFilters(DEFAULT_PRODUCTS_FILTERS);
    setCurrentPage(1);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsAddProductOpen(true);
  };

  const handleEditProduct = (product: PdvProduct) => {
    setEditingProduct(product);
    setIsAddProductOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!productPendingDelete) return;
    const deletedName = productPendingDelete.name;
    deleteProduct(productPendingDelete.id);
    setProductPendingDelete(null);
    toast({
      variant: 'success',
      title: 'Produto excluído',
      description: `${deletedName} foi removido com sucesso.`,
    });
  };

  const hasActiveFilter = isProductsFiltersActive(appliedFilters);

  return (
    <div className="flex h-full min-h-0 p-6">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-xs">
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e5e5] px-6 py-4 select-none">
          <h1 className="text-xl font-bold text-[#171717]">Produtos</h1>

          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#737373]" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar nome do produto..."
                className="h-10 w-[320px] rounded-xl border-[#e5e5e5] bg-white text-sm focus:border-primary !pl-10 !pr-4"
              />
            </div>

            <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-[#e5e5e5] bg-white px-4 text-sm font-semibold text-[#171717] hover:bg-black/[0.02] cursor-pointer"
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
              onClick={handleOpenFilters}
              className={cn(
                'flex h-10 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold cursor-pointer',
                hasActiveFilter
                  ? 'border-primary/20 bg-primary/5 text-primary'
                  : 'border-[#e5e5e5] bg-white text-[#171717] hover:bg-black/[0.02]',
              )}
            >
              <SlidersHorizontalIcon className="size-4 text-[#737373]" />
              <span>Filtrar</span>
            </button>

            <button
              type="button"
              onClick={handleAddProduct}
              className="pdv-primary-gradient-btn flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <PlusIcon className="size-4" />
              <span>Adicionar Produto</span>
            </button>
          </div>
        </div>

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
              onClick={handleClearAllFilters}
              className="ml-1 text-xs font-semibold text-[#737373] transition-colors hover:text-[#171717] hover:underline cursor-pointer"
            >
              Limpar tudo
            </button>
          </div>
        )}

        <div
          className={cn(
            'grid shrink-0 items-center border-b border-[#e5e5e5] bg-[#f9f9f9] px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a3a3a3] select-none',
            GRID_COLS,
          )}
        >
          <div className="flex h-4 items-center border-r border-[#e5e5e5] pr-4">ID</div>
          <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">
            Nome do produto
          </div>
          <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">Categoria</div>
          <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">Estoque</div>
          <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">Preço</div>
          <div className="flex h-4 items-center border-r border-[#e5e5e5] px-4">Status</div>
          <div />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredAndSortedProducts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center select-none">
              <div className="relative mb-6 flex size-24 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#EAEAEA]/40 shadow-inner">
                <div className="relative flex size-14 items-center justify-center rounded-xl border border-[#e5e5e5] bg-white shadow-xs">
                  <svg
                    className="size-7 text-[#A3A3A3]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                  <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#404040] text-white shadow-xs">
                    <span className="text-[10px] font-bold">?</span>
                  </div>
                </div>
              </div>

              <h3 className="mb-1 text-lg font-bold text-[#171717]">Nenhum produto encontrado</h3>
              <p className="text-sm font-medium text-[#737373]">
                Toque em{' '}
                <span className="font-bold text-[#171717]">&quot;Adicionar Produto&quot;</span> para
                cadastrar um novo produto
              </p>
            </div>
          ) : (
            <ScrollArea type="scroll" className="h-full">
              <div className="divide-y divide-[#e5e5e5]">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      'grid w-full items-center border-b border-[#e5e5e5] bg-transparent px-6 py-3.5 text-left text-sm text-[#171717] transition-colors hover:bg-black/[0.015]',
                      GRID_COLS,
                    )}
                  >
                    <div className="truncate font-bold text-[#171717]">{product.id}</div>
                    <div className="min-w-0 px-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-[#e5e5e5] bg-[#fafafa]">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt=""
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center text-[#d4d4d4]">
                              <ImageIcon className="size-5" aria-hidden strokeWidth={1.5} />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-[#171717]">{product.name}</div>
                          <p className="truncate text-xs font-medium text-[#a3a3a3]">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="truncate px-4 text-[#525252]">{product.category}</div>
                    <div className="truncate px-4">{product.stock}</div>
                    <div className="truncate px-4 font-semibold">
                      {formatCatalogPrice(product.priceCents)}
                    </div>
                    <div className="px-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                          PRODUCT_STATUS_PILL_CLASS[product.status],
                        )}
                      >
                        {PRODUCT_STATUS_LABEL[product.status]}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Ações do produto"
                            className="flex size-8 items-center justify-center rounded-lg text-[#737373] transition-colors hover:bg-black/[0.05] hover:text-[#171717] cursor-pointer"
                          >
                            <MoreVerticalIcon className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <EyeIcon className="size-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <PencilIcon className="size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setProductPendingDelete(product)}
                          >
                            <Trash2Icon className="size-4" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {filteredAndSortedProducts.length > 0 && (
          <div className="flex shrink-0 items-center justify-between border-t border-[#e5e5e5] px-6 py-3 text-sm text-[#737373] select-none">
            <span>
              {filteredAndSortedProducts.length} produto
              {filteredAndSortedProducts.length === 1 ? '' : 's'}
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

      <ProductFormModal
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        productToEdit={editingProduct}
      />

      <ProductsFiltersModal
        open={isFiltersOpen}
        onOpenChange={(open) => {
          if (open) {
            setDraftFilters(appliedFilters);
          }
          setIsFiltersOpen(open);
        }}
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        categories={categoryOptions}
        onCancel={() => setIsFiltersOpen(false)}
        onApply={handleApplyFilters}
      />

      <PdvDeleteModal
        open={productPendingDelete !== null}
        title="Excluir produto?"
        description={
          productPendingDelete
            ? `Tem certeza que deseja remover ${productPendingDelete.name}?`
            : ''
        }
        confirmLabel="Sim, Excluir"
        onCancel={() => setProductPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
