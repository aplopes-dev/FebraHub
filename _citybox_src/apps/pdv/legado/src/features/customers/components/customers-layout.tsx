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
} from 'lucide-react';
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
import { usePosStore } from '@/features/pos/hooks/use-pos-store';
import {
  CUSTOMER_SEX_OPTIONS,
  formatCustomerFullName,
  formatCustomerMemberSince,
  formatCustomerPhoneDisplay,
  type CustomerSex,
  type PosCustomer,
} from '@/features/pos/types/customer';
import { CustomerFormModal } from './customer-form-modal';
import { CustomerDetailModal } from './customer-detail-modal';

type SortOption = 'name_asc' | 'name_desc' | 'member_recent' | 'member_oldest';

type SortOptionConfig = {
  id: SortOption;
  label: string;
};

const SORT_OPTIONS: readonly SortOptionConfig[] = [
  { id: 'name_asc', label: 'Nome (A-Z)' },
  { id: 'name_desc', label: 'Nome (Z-A)' },
  { id: 'member_recent', label: 'Membro mais recente' },
  { id: 'member_oldest', label: 'Membro mais antigo' },
] as const;

type GenderFilter = 'all' | CustomerSex;

const GENDER_LABEL: Record<CustomerSex, string> = {
  female: 'Feminino',
  male: 'Masculino',
  other: 'Outro',
};

const GENDER_FILTER_OPTIONS: readonly { id: GenderFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  ...CUSTOMER_SEX_OPTIONS,
] as const;

/** `'new'` = cadastro; um `PosCustomer` = edição; `null` = fechado. */
type CustomerFormTarget = 'new' | PosCustomer | null;

export function CustomersLayout() {
  const customers = usePosStore((state) => state.customers);
  const deleteCustomerRecord = usePosStore((state) => state.deleteCustomerRecord);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [isGenderFilterOpen, setIsGenderFilterOpen] = useState(false);
  const [customerFormTarget, setCustomerFormTarget] = useState<CustomerFormTarget>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);
  const [customerPendingDelete, setCustomerPendingDelete] = useState<PosCustomer | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((customer) =>
        formatCustomerFullName(customer).toLowerCase().includes(q),
      );
    }

    if (genderFilter !== 'all') {
      result = result.filter((customer) => customer.sex === genderFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return formatCustomerFullName(b).localeCompare(formatCustomerFullName(a));
        case 'member_recent':
          return new Date(b.memberSince).getTime() - new Date(a.memberSince).getTime();
        case 'member_oldest':
          return new Date(a.memberSince).getTime() - new Date(b.memberSince).getTime();
        case 'name_asc':
        default:
          return formatCustomerFullName(a).localeCompare(formatCustomerFullName(b));
      }
    });

    return result;
  }, [customers, searchQuery, genderFilter, sortBy]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSortedCustomers.length / itemsPerPage));
  }, [filteredAndSortedCustomers.length, itemsPerPage]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCustomers, currentPage, itemsPerPage]);

  const handleSelectSort = (option: SortOption) => {
    setSortBy(option);
    setCurrentPage(1);
    setIsSortOpen(false);
  };

  const handleSelectGenderFilter = (option: GenderFilter) => {
    setGenderFilter(option);
    setCurrentPage(1);
    setIsGenderFilterOpen(false);
  };

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

  if (genderFilter !== 'all') {
    activePills.push({
      key: 'gender',
      label: `Sexo: ${GENDER_LABEL[genderFilter]}`,
      onRemove: () => {
        setGenderFilter('all');
        setCurrentPage(1);
      },
    });
  }

  const handleClearAllFilters = () => {
    setSortBy('name_asc');
    setGenderFilter('all');
    setCurrentPage(1);
  };

  const handleConfirmDeleteCustomer = () => {
    if (!customerPendingDelete) return;
    const deletedName = formatCustomerFullName(customerPendingDelete);
    deleteCustomerRecord(customerPendingDelete.id);
    setCustomerPendingDelete(null);
    toast({
      variant: 'success',
      title: 'Cliente excluído',
      description: `${deletedName} foi removido com sucesso.`,
    });
  };

  return (
    <div className="flex h-full min-h-0 p-6">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-[#e5e5e5] bg-white shadow-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-4 shrink-0 select-none">
          <h1 className="text-xl font-bold text-[#171717]">Clientes</h1>

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
                placeholder="Buscar nome do cliente..."
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
                          : 'text-[#171717] hover:bg-black/[0.04]',
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

            {/* Filter Button (sexo) */}
            <Popover open={isGenderFilterOpen} onOpenChange={setIsGenderFilterOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex h-10 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold cursor-pointer',
                    genderFilter !== 'all'
                      ? 'border-primary/20 bg-primary/5 text-primary'
                      : 'border-[#e5e5e5] bg-white text-[#171717] hover:bg-black/[0.02]',
                  )}
                >
                  <SlidersHorizontalIcon className="size-4 text-[#737373]" />
                  <span>Filtrar</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 flex-col gap-1 p-1.5">
                {GENDER_FILTER_OPTIONS.map((option) => {
                  const isActive = option.id === genderFilter;
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
                      onClick={() => handleSelectGenderFilter(option.id)}
                    >
                      <span>{option.label}</span>
                      {isActive && <CheckIcon className="size-4" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>

            {/* Add Customer */}
            <button
              type="button"
              onClick={() => setCustomerFormTarget('new')}
              className="pdv-primary-gradient-btn flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <PlusIcon className="size-4" strokeWidth={2.5} />
              <span>Adicionar Cliente</span>
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
        <div className="grid grid-cols-[90px_140px_140px_110px_160px_1fr_130px_40px] bg-[#f9f9f9] px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#a3a3a3] border-b border-[#e5e5e5] shrink-0 select-none items-center">
          <div className="border-r border-[#e5e5e5] pr-4 h-4 flex items-center">ID</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Nome</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Sobrenome</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Sexo</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Telefone</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Endereço</div>
          <div className="border-r border-[#e5e5e5] px-4 h-4 flex items-center">Membro desde</div>
          <div></div>
        </div>

        {/* Customers List / Empty State */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filteredAndSortedCustomers.length === 0 ? (
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

              <h3 className="text-lg font-bold text-[#171717] mb-1">Nenhum Cliente Encontrado</h3>
              <p className="text-sm font-medium text-[#737373]">
                Toque em <span className="font-bold text-[#171717]">&quot;Adicionar Cliente&quot;</span> para adicionar um novo cliente
              </p>
            </div>
          ) : (
            <ScrollArea type="scroll" className="h-full">
              <div className="divide-y divide-[#e5e5e5]">
                {paginatedCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="grid w-full grid-cols-[90px_140px_140px_110px_160px_1fr_130px_40px] px-6 py-3.5 items-center text-left text-sm text-[#171717] hover:bg-black/[0.015] transition-colors border-b border-[#e5e5e5] bg-transparent"
                  >
                    <div className="font-bold text-[#171717] truncate">{customer.id}</div>
                    <div className="truncate font-medium">{customer.firstName}</div>
                    <div className="truncate font-medium">{customer.lastName}</div>
                    <div className="truncate">{GENDER_LABEL[customer.sex]}</div>
                    <div className="truncate">{formatCustomerPhoneDisplay(customer.phone)}</div>
                    <div className="truncate pr-2 text-[#525252]">
                      {customer.address ? customer.address : <span className="text-[#a3a3a3]">-</span>}
                    </div>
                    <div className="truncate select-none">
                      {formatCustomerMemberSince(customer.memberSince)}
                    </div>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Ações do cliente"
                            className="flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-black/[0.05] hover:text-[#171717] transition-colors cursor-pointer"
                          >
                            <MoreVerticalIcon className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                            <EyeIcon className="size-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCustomerFormTarget(customer)}>
                            <PencilIcon className="size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setCustomerPendingDelete(customer)}
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

        {/* Pagination Footer */}
        {filteredAndSortedCustomers.length > 0 && (
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer',
                      isActive ? 'bg-primary text-white' : 'text-[#737373] hover:bg-black/[0.03]',
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-black/[0.03] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold text-base"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      <CustomerFormModal
        open={customerFormTarget !== null}
        customer={customerFormTarget === 'new' ? null : customerFormTarget}
        onOpenChange={(open) => !open && setCustomerFormTarget(null)}
      />

      <CustomerDetailModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onEdit={(customer) => {
          setSelectedCustomer(null);
          setCustomerFormTarget(customer);
        }}
      />

      <PdvDeleteModal
        open={customerPendingDelete !== null}
        title="Deletar cliente?"
        description={
          customerPendingDelete
            ? `Tem certeza que deseja deletar ${formatCustomerFullName(customerPendingDelete)}? Essa ação não pode ser desfeita.`
            : ''
        }
        onCancel={() => setCustomerPendingDelete(null)}
        onConfirm={handleConfirmDeleteCustomer}
      />
    </div>
  );
}
