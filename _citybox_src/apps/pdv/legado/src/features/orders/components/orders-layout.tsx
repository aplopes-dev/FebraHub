'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  LayoutGridIcon,
  ClipboardListIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  SearchIcon,
  ArrowUpDownIcon,
  SlidersHorizontalIcon,
  ExternalLinkIcon,
  MoreVerticalIcon,
  EyeIcon,
  PrinterIcon,
  Trash2Icon,
  CheckIcon,
  ChevronDownIcon,
  XIcon,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Input,
  ScrollArea,
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@citybox/ui/atoms';
import { CurrencyInput } from '@citybox/ui/molecules';
import { useToast } from '@/components/toast';
import { usePosStore } from '@/features/pos/hooks/use-pos-store';
import { formatCatalogPrice } from '@/features/pos/data/placeholder-catalog-products';
import { ReceiptPreviewModal } from '@/features/pos/components/receipt-preview-modal';
import { buildOrderReceiptData } from '@/features/pos/lib/build-order-receipt';
import { PdvDeleteModal } from '@/components/pdv-delete-modal';
import type { OrderItem, PosOrder, PosOrderStatus } from '@/features/pos/types/order';
import type { ReceiptData } from '@/features/pos/types/receipt';
import { PAYMENT_METHOD_LABEL, type PaymentMethodId } from '@/features/pos/types/payment';

type FilterId = 'all' | PosOrderStatus;

type FilterOption = {
  id: FilterId;
  label: string;
  icon: typeof LayoutGridIcon;
};

const FILTER_OPTIONS: readonly FilterOption[] = [
  { id: 'all', label: 'Todos', icon: LayoutGridIcon },
  { id: 'open', label: 'Abertos', icon: ClipboardListIcon },
  { id: 'in_progress', label: 'Em Progresso', icon: ClockIcon },
  { id: 'completed', label: 'Concluídos', icon: CheckCircle2Icon },
  { id: 'cancelled', label: 'Cancelados', icon: XCircleIcon },
] as const;

type SortOption = 'recent' | 'items_desc' | 'total_desc' | 'total_asc';

type SortOptionConfig = {
  id: SortOption;
  label: string;
};

const SORT_OPTIONS: readonly SortOptionConfig[] = [
  { id: 'recent', label: 'Mais recentes' },
  { id: 'items_desc', label: 'Maior quantidade de itens' },
  { id: 'total_desc', label: 'Maior valor pago' },
  { id: 'total_asc', label: 'Menor valor pago' },
] as const;

type OrderTypeFilter = 'all' | 'dine_in' | 'take_away';

type OrdersFilters = {
  paymentMethod: 'all' | PaymentMethodId;
  orderType: OrderTypeFilter;
  /** Valores em reais (ex.: 29.9 representa R$ 29,90); 0 significa "sem filtro". */
  minAmount: number;
  maxAmount: number;
};

const DEFAULT_ORDERS_FILTERS: OrdersFilters = {
  paymentMethod: 'all',
  orderType: 'all',
  minAmount: 0,
  maxAmount: 0,
};

const PAYMENT_METHOD_FILTER_OPTIONS: readonly { id: 'all' | PaymentMethodId; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'cash', label: PAYMENT_METHOD_LABEL.cash },
  { id: 'credit', label: PAYMENT_METHOD_LABEL.credit },
  { id: 'debit', label: PAYMENT_METHOD_LABEL.debit },
  { id: 'pix', label: PAYMENT_METHOD_LABEL.pix },
] as const;

const ORDER_TYPE_FILTER_OPTIONS: readonly { id: 'dine_in' | 'take_away'; label: string }[] = [
  { id: 'dine_in', label: 'Consumo Local' },
  { id: 'take_away', label: 'Para Viagem' },
] as const;

function calculateItemLineTotal(item: OrderItem): number {
  const optionsTotal = item.selectedOptions.reduce((acc, opt) => acc + opt.priceCents, 0);
  return (item.priceCents + optionsTotal) * item.quantity;
}

export function OrdersLayout() {
  const orders = usePosStore((state) => state.orders);
  const deleteOrder = usePosStore((state) => state.deleteOrder);
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<OrdersFilters>(DEFAULT_ORDERS_FILTERS);
  const [draftFilters, setDraftFilters] = useState<OrdersFilters>(DEFAULT_ORDERS_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PosOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<PosOrder | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [orderPendingDelete, setOrderPendingDelete] = useState<PosOrder | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Compute counts for status buttons based on original list
  const counts = useMemo(() => {
    return {
      all: orders.length,
      open: orders.filter((o) => o.status === 'open').length,
      in_progress: orders.filter((o) => o.status === 'in_progress').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // Filter by status
    if (activeFilter !== 'all') {
      result = result.filter((o) => o.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      // Allow searching by ID (e.g. #201OE10) or customer name
      result = result.filter(
        (o) => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
      );
    }

    // Filter by order type
    if (appliedFilters.orderType !== 'all') {
      const typeLabel = appliedFilters.orderType === 'take_away' ? 'Delivery' : 'Consumo Local';
      result = result.filter((o) => o.type === typeLabel);
    }

    // Filter by payment method
    if (appliedFilters.paymentMethod !== 'all') {
      result = result.filter((o) => o.paymentMethod === appliedFilters.paymentMethod);
    }

    // Filter by amount range (0 = sem filtro)
    if (appliedFilters.minAmount > 0) {
      const minAmountCents = Math.round(appliedFilters.minAmount * 100);
      result = result.filter((o) => o.totalCents >= minAmountCents);
    }
    if (appliedFilters.maxAmount > 0) {
      const maxAmountCents = Math.round(appliedFilters.maxAmount * 100);
      result = result.filter((o) => o.totalCents <= maxAmountCents);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'items_desc':
          return b.qty - a.qty;
        case 'total_desc':
          return b.totalCents - a.totalCents;
        case 'total_asc':
          return a.totalCents - b.totalCents;
        case 'recent':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [orders, activeFilter, searchQuery, sortBy, appliedFilters]);

  // Calculate pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSortedOrders.length / itemsPerPage));
  }, [filteredAndSortedOrders.length, itemsPerPage]);

  // Slice list for current page
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedOrders, currentPage, itemsPerPage]);

  const handleSelectSort = (option: SortOption) => {
    setSortBy(option);
    setCurrentPage(1);
    setIsSortOpen(false);
  };

  const isFiltersActive =
    appliedFilters.paymentMethod !== 'all' ||
    appliedFilters.orderType !== 'all' ||
    appliedFilters.minAmount > 0 ||
    appliedFilters.maxAmount > 0;

  const activePills: { key: string; label: string; onRemove: () => void }[] = [];

  if (sortBy !== 'recent') {
    const sortOption = SORT_OPTIONS.find((option) => option.id === sortBy);
    activePills.push({
      key: 'sort',
      label: `Ordenar: ${sortOption?.label ?? ''}`,
      onRemove: () => {
        setSortBy('recent');
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.paymentMethod !== 'all') {
    activePills.push({
      key: 'paymentMethod',
      label: `Pagamento: ${PAYMENT_METHOD_LABEL[appliedFilters.paymentMethod]}`,
      onRemove: () => {
        setAppliedFilters((prev) => ({ ...prev, paymentMethod: 'all' }));
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.orderType !== 'all') {
    const typeOption = ORDER_TYPE_FILTER_OPTIONS.find(
      (option) => option.id === appliedFilters.orderType
    );
    activePills.push({
      key: 'orderType',
      label: `Tipo: ${typeOption?.label ?? ''}`,
      onRemove: () => {
        setAppliedFilters((prev) => ({ ...prev, orderType: 'all' }));
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.minAmount > 0) {
    activePills.push({
      key: 'minAmount',
      label: `Mínimo: ${formatCatalogPrice(Math.round(appliedFilters.minAmount * 100))}`,
      onRemove: () => {
        setAppliedFilters((prev) => ({ ...prev, minAmount: 0 }));
        setCurrentPage(1);
      },
    });
  }

  if (appliedFilters.maxAmount > 0) {
    activePills.push({
      key: 'maxAmount',
      label: `Máximo: ${formatCatalogPrice(Math.round(appliedFilters.maxAmount * 100))}`,
      onRemove: () => {
        setAppliedFilters((prev) => ({ ...prev, maxAmount: 0 }));
        setCurrentPage(1);
      },
    });
  }

  const handleClearAllFilters = () => {
    setSortBy('recent');
    setAppliedFilters(DEFAULT_ORDERS_FILTERS);
    setCurrentPage(1);
  };

  const openFiltersModal = () => {
    setDraftFilters(appliedFilters);
    setIsFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    setIsFiltersOpen(false);
  };

  const handlePrintReceipt = (order: PosOrder) => {
    setReceiptOrder(order);
    setIsReceiptOpen(true);
  };

  const handleConfirmDeleteOrder = () => {
    if (!orderPendingDelete) return;
    const deletedOrderId = orderPendingDelete.id;
    deleteOrder(orderPendingDelete);
    setOrderPendingDelete(null);
    toast({
      variant: 'success',
      title: 'Pedido excluído',
      description: `O pedido ${deletedOrderId} foi removido com sucesso.`,
    });
  };

  const receiptData: ReceiptData | null = receiptOrder
    ? buildOrderReceiptData(receiptOrder)
    : null;

  const orderSubtotalCents = selectedOrder
    ? selectedOrder.items.reduce((acc, item) => acc + calculateItemLineTotal(item), 0)
    : 0;
  const orderDiscountCents = selectedOrder
    ? Math.max(0, orderSubtotalCents - selectedOrder.totalCents)
    : 0;

  const getStatusBadge = (status: PosOrderStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center rounded-md bg-[#f0fdf4] px-2 py-0.5 text-xs font-bold text-[#16a34a] border border-[#bbf7d0] select-none">
            Concluído
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center rounded-md bg-[#fffbeb] px-2 py-0.5 text-xs font-bold text-[#d97706] border border-[#fef3c7] select-none">
            Em Progresso
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center rounded-md bg-[#f0f7ff] px-2 py-0.5 text-xs font-bold text-[#0284c7] border border-[#bae6fd] select-none">
            Aberto
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center rounded-md bg-[#fdf2f8] px-2 py-0.5 text-xs font-bold text-[#db2777] border border-[#fbcfe8] select-none">
            Cancelado
          </span>
        );
    }
  };

  const formatOrderDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const datePart = d.toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return { datePart, timePart };
    } catch {
      return { datePart: dateStr, timePart: '' };
    }
  };

  return (
    <div className="flex h-full min-h-0 gap-6 p-6">
      {/* Left Column (Status Filters) */}
      <div className="flex w-[144px] shrink-0 flex-col gap-3 select-none">
        {FILTER_OPTIONS.map((filter) => {
          const Icon = filter.icon;
          const isActive = filter.id === activeFilter;
          const count = counts[filter.id];

          return (
            <button
              key={filter.id}
              type="button"
              className={cn(
                'pdv-order-status-filter relative flex flex-col w-full aspect-square p-5 rounded-2xl border-none text-left cursor-pointer transition-all outline-none',
                isActive && 'pdv-order-status-filter-active'
              )}
              onClick={() => {
                setActiveFilter(filter.id);
                setCurrentPage(1);
              }}
            >
              {isActive && <span className="pdv-order-status-filter-accent" aria-hidden />}

              {/* Icon + Label row */}
              <div className="flex items-center gap-2 text-current">
                <Icon className="size-4 shrink-0" strokeWidth={2} />
                <span className="text-xs font-bold">{filter.label}</span>
              </div>

              {/* Large Count at the bottom */}
              <span className="text-4xl font-extrabold tracking-tight mt-auto text-[#171717]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Column (Orders Container) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-[#e5e5e5] bg-white shadow-xs overflow-hidden">
        {/* Header of the Orders container */}
        <div className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-4 shrink-0 select-none">
          <h1 className="text-xl font-bold text-[#171717]">Pedidos</h1>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#737373]" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar ID do pedido..."
                className="h-10 w-[240px] rounded-xl border-[#e5e5e5] bg-white text-sm focus:border-primary !pl-10 !pr-4"
              />
            </div>

            {/* Sort Button */}
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
              <PopoverContent align="start" className="w-56 flex-col gap-1 p-1.5">
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
                          : 'text-[#171717] hover:bg-black/[0.04]'
                      )}
                      onClick={() => handleSelectSort(option.id)}
                    >
                      <span>{option.label}</span>
                      {isActive && <CheckIcon className="size-4" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>

            {/* Filter Button */}
            <button
              type="button"
              onClick={openFiltersModal}
              className={cn(
                'flex h-10 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold cursor-pointer',
                isFiltersActive
                  ? 'border-primary/20 bg-primary/5 text-primary'
                  : 'border-[#e5e5e5] bg-white text-[#171717] hover:bg-black/[0.02]'
              )}
            >
              <SlidersHorizontalIcon className="size-4 text-[#737373]" />
              <span>Filtrar</span>
            </button>
          </div>
        </div>

        {/* Active Filters / Sort Pills */}
        {activePills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e5e5] bg-white px-6 py-3 shrink-0">
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

        {/* Table Columns header with vertical dividers */}
        <div className="grid grid-cols-[110px_130px_1.5fr_1.8fr_130px_70px_120px_40px] bg-[#f9f9f9] px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a3a3a3] border-b border-[#e5e5e5] shrink-0 select-none items-center">
          <div className="border-r border-[#e5e5e5] pr-4 h-4 flex items-center">ID</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Status</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Data do Pedido</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Cliente</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Tipo</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center justify-center">Qtd</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center justify-end">Total</div>
          <div></div>
        </div>

        {/* Orders List / Empty State */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filteredAndSortedOrders.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8 select-none">
              {/* Graphic illustration */}
              <div className="relative flex size-24 items-center justify-center rounded-full bg-[#EAEAEA]/40 border border-[#e5e5e5] shadow-inner mb-6">
                <div className="relative flex size-14 items-center justify-center rounded-xl bg-white shadow-xs border border-[#e5e5e5]">
                  <svg className="size-7 text-[#A3A3A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#404040] text-white border-2 border-white shadow-xs">
                    <span className="text-[10px] font-bold">?</span>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#171717] mb-1">Nenhum Pedido Encontrado</h3>
              <p className="text-sm font-medium text-[#737373]">Ainda não há histórico de atividade de pedidos</p>
            </div>
          ) : (
            <ScrollArea type="scroll" className="h-full">
              <div className="divide-y divide-[#e5e5e5]">
                {paginatedOrders.map((order) => {
                  const { datePart, timePart } = formatOrderDate(order.date);
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="grid w-full grid-cols-[110px_130px_1.5fr_1.8fr_130px_70px_120px_40px] px-6 py-3.5 items-center text-left text-sm text-[#171717] hover:bg-black/[0.015] transition-colors border-b border-[#e5e5e5] bg-transparent cursor-pointer"
                    >
                      <div className="font-bold text-[#171717]">{order.id}</div>
                      <div>{getStatusBadge(order.status)}</div>
                      <div className="text-xs text-[#171717] leading-tight select-none">
                        <span className="block font-medium text-[#171717] capitalize">{datePart}</span>
                        {timePart && <span className="block text-[10px] text-[#737373] mt-0.5">{timePart}</span>}
                      </div>
                      <div className="truncate pr-2">
                        {order.customerName !== '-' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#e5e5e5] bg-[#E5E5E5]/20 px-2.5 py-0.5 text-xs font-semibold text-[#525252] select-none">
                            {order.customerName}
                            <ExternalLinkIcon className="size-3 text-[#737373]" />
                          </span>
                        ) : (
                          <span className="text-[#a3a3a3] font-medium select-none">-</span>
                        )}
                      </div>
                      <div className="text-[#171717] font-semibold select-none">
                        {order.type === 'Delivery' ? 'Para Viagem' : 'Consumo Local'}
                      </div>
                      <div className="text-center font-medium select-none">
                        {order.qty > 0 ? order.qty : <span className="text-[#a3a3a3]">-</span>}
                      </div>
                      <div className="text-right font-extrabold text-[#171717]">
                        {order.totalCents > 0 ? (
                          formatCatalogPrice(order.totalCents)
                        ) : (
                          <span className="text-[#a3a3a3] font-semibold">-</span>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Ações do pedido"
                              className="flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-black/[0.05] hover:text-[#171717] transition-colors cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVerticalIcon className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                              <EyeIcon className="size-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintReceipt(order)}>
                              <PrinterIcon className="size-4" />
                              Imprimir recibo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setOrderPendingDelete(order)}
                            >
                              <Trash2Icon className="size-4" />
                              Deletar
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

        {/* Pagination Footer */}
        {filteredAndSortedOrders.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#e5e5e5] bg-white px-6 py-4 shrink-0 select-none">
            {/* Rows per page selector */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#737373]">
              <span>Linhas por página</span>
              <div className="relative flex items-center">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-none font-bold text-[#171717] outline-none cursor-pointer pr-4 appearance-none"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span className="pointer-events-none text-[#171717] text-[8px] ml-1">▼</span>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                className="flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-black/[0.03] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold text-base"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPage(pageNum);
                    }}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer',
                      isActive ? 'bg-primary text-white' : 'text-[#737373] hover:bg-black/[0.03]'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                className="flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-black/[0.03] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold text-base"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="flex w-full max-w-[620px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[620px]">
            <DialogTitle className="sr-only">Detalhes do Pedido</DialogTitle>

            <div className="relative flex shrink-0 items-center justify-center bg-[#E5E5E5] px-8 py-5 text-[#171717]">
              <h2 className="text-xl font-bold tracking-tight">Detalhes do Pedido</h2>
              <button
                type="button"
                aria-label="Imprimir recibo"
                className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-[#525252] transition-colors hover:bg-black/5 cursor-pointer"
                onClick={() => handlePrintReceipt(selectedOrder)}
              >
                <PrinterIcon className="size-5" strokeWidth={2} />
              </button>
            </div>

            <ScrollArea type="scroll" className="max-h-[65vh]">
              <div className="flex flex-col gap-6 bg-white px-8 py-6 text-[#171717]">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">
                      ID do Pedido
                    </span>
                    <span className="text-base font-bold text-[#171717]">{selectedOrder.id}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">
                      Data do Pedido
                    </span>
                    <span className="text-base font-bold text-[#171717]">
                      {formatOrderDate(selectedOrder.date).datePart} –{' '}
                      {formatOrderDate(selectedOrder.date).timePart}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">
                      Status
                    </span>
                    <span>{getStatusBadge(selectedOrder.status)}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">
                      Tipo de Pedido
                    </span>
                    <span className="text-base font-bold text-[#171717]">
                      {selectedOrder.type === 'Delivery' ? 'Para Viagem' : 'Consumo Local'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">
                      Forma de Pagamento
                    </span>
                    <span className="text-base font-bold text-[#171717]">
                      {PAYMENT_METHOD_LABEL[selectedOrder.paymentMethod]}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">
                      Cliente
                    </span>
                    {selectedOrder.customerName !== '-' ? (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#e5e5e5] bg-[#E5E5E5]/20 px-2.5 py-0.5 text-sm font-semibold text-[#525252]">
                        {selectedOrder.customerName}
                        <ExternalLinkIcon className="size-3 text-[#737373]" />
                      </span>
                    ) : (
                      <span className="text-base font-bold text-[#a3a3a3]">Consumidor final</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#a3a3a3]">
                      Atendente
                    </span>
                    <span className="text-base font-bold text-[#171717]">{selectedOrder.cashierName}</span>
                  </div>
                </div>

                {/* Items table */}
                <div className="overflow-hidden rounded-xl border border-[#e5e5e5]">
                  <div className="grid grid-cols-[1fr_64px_96px] bg-[#f5f5f5] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                    <div>Produto</div>
                    <div className="text-center">Qtd</div>
                    <div className="text-right">Preço</div>
                  </div>
                  {selectedOrder.items.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs font-medium text-[#a3a3a3]">
                      Nenhum item lançado (Lançamento avulso)
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e5e5e5]">
                      {selectedOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[1fr_64px_96px] items-center px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f0f0f0]">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt=""
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <ImageIcon className="size-5 text-[#c7c7c7]" strokeWidth={1.5} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-[#171717]">
                                {item.name}
                              </div>
                              {item.selectedOptions.map((opt) => (
                                <span
                                  key={opt.valueId}
                                  className="block truncate text-xs text-[#737373]"
                                >
                                  • {opt.groupName}: {opt.valueName}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-center text-sm font-medium text-[#171717]">
                            {item.quantity}
                          </div>
                          <div className="text-right text-sm font-bold text-[#171717]">
                            {formatCatalogPrice(calculateItemLineTotal(item))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="flex flex-col gap-2 rounded-xl bg-[#f5f5f5] px-5 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#a3a3a3]">Subtotal</span>
                    <span className="font-semibold text-[#171717]">
                      {formatCatalogPrice(orderSubtotalCents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#a3a3a3]">Desconto</span>
                    <span
                      className={cn(
                        'font-semibold',
                        orderDiscountCents > 0 ? 'text-[#171717]' : 'text-[#c7c7c7]'
                      )}
                    >
                      {formatCatalogPrice(orderDiscountCents)}
                    </span>
                  </div>
                  <div className="my-1 h-px w-full bg-[#e5e5e5]" />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#171717]">Total</span>
                    <span className="text-2xl font-extrabold text-[#171717]">
                      {formatCatalogPrice(selectedOrder.totalCents)}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex shrink-0 items-center justify-end border-t border-[#E5E5E5] bg-white px-8 py-4">
              <button
                type="button"
                className="pdv-gradient-border-btn flex h-11 items-center justify-center rounded-lg px-8 text-sm font-semibold text-[#171717] cursor-pointer"
                onClick={() => setSelectedOrder(null)}
              >
                Fechar
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ReceiptPreviewModal
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        receipt={receiptData}
      />

      {/* Filters Modal */}
      <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DialogContent className="flex w-full max-w-[440px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[440px]">
          <DialogTitle className="sr-only">Filtros</DialogTitle>

          <div className="flex shrink-0 items-center justify-center bg-[#E5E5E5] px-8 py-5 text-[#171717]">
            <h2 className="text-xl font-bold tracking-tight">Filtros</h2>
          </div>

          <div className="flex flex-col gap-5 bg-[#F7F7F7] px-8 py-6 text-[#171717]">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#171717]">Forma de Pagamento</span>
              <DropdownMenu open={isPaymentMethodOpen} onOpenChange={setIsPaymentMethodOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E5E5E5] bg-white px-4 text-base font-normal text-[#171717] hover:bg-black/[0.01] cursor-pointer"
                  >
                    <span>
                      {draftFilters.paymentMethod === 'all'
                        ? 'Todos'
                        : PAYMENT_METHOD_LABEL[draftFilters.paymentMethod]}
                    </span>
                    <ChevronDownIcon className="size-4 text-[#737373]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {PAYMENT_METHOD_FILTER_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() =>
                        setDraftFilters((prev) => ({ ...prev, paymentMethod: option.id }))
                      }
                    >
                      <span className="flex-1">{option.label}</span>
                      {draftFilters.paymentMethod === option.id && (
                        <CheckIcon className="size-4" strokeWidth={2.5} />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-[#171717]">Tipo de Pedido</span>
              <div className="flex items-center gap-6">
                {ORDER_TYPE_FILTER_OPTIONS.map((option) => {
                  const isSelected = draftFilters.orderType === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          orderType: prev.orderType === option.id ? 'all' : option.id,
                        }))
                      }
                    >
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border-2 transition-colors',
                          isSelected ? 'border-primary' : 'border-[#c7c7c7]'
                        )}
                      >
                        {isSelected && <span className="size-2.5 rounded-full bg-primary" />}
                      </span>
                      <span className="text-sm font-medium text-[#171717]">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#171717]">Valor Mínimo</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
                    R$
                  </span>
                  <CurrencyInput
                    value={draftFilters.minAmount}
                    onValueChange={(value) =>
                      setDraftFilters((prev) => ({ ...prev, minAmount: value }))
                    }
                    className="h-12 rounded-xl border-[#E5E5E5] bg-white text-base focus:border-primary !pl-10 !pr-4"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#171717]">Valor Máximo</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
                    R$
                  </span>
                  <CurrencyInput
                    value={draftFilters.maxAmount}
                    onValueChange={(value) =>
                      setDraftFilters((prev) => ({ ...prev, maxAmount: value }))
                    }
                    className="h-12 rounded-xl border-[#E5E5E5] bg-white text-base focus:border-primary !pl-10 !pr-4"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0 border-t border-[#E5E5E5] bg-white px-8 py-4">
            <button
              type="button"
              className="pdv-gradient-border-btn flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold text-[#171717] cursor-pointer"
              onClick={() => setIsFiltersOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundImage: 'linear-gradient(to bottom, #4CAF50 0%, #2E7D32 100%)' }}
              onClick={handleApplyFilters}
            >
              Aplicar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <PdvDeleteModal
        open={orderPendingDelete !== null}
        title="Deletar pedido?"
        description={
          orderPendingDelete
            ? `Tem certeza que deseja deletar o pedido ${orderPendingDelete.id}? Essa ação não pode ser desfeita.`
            : ''
        }
        onCancel={() => setOrderPendingDelete(null)}
        onConfirm={handleConfirmDeleteOrder}
      />
    </div>
  );
}
