'use client';

import { useState } from 'react';
import {
  ShoppingBagIcon,
  DollarSignIcon,
  UsersIcon,
  UserPlusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DownloadIcon,
  MoreVerticalIcon,
  ChevronDownIcon,
  ImageIcon,
  TrophyIcon,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@citybox/ui';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import { useToast } from '@/components/toast';
import {
  MOCK_KPI_CARDS,
  MOCK_PRODUCT_STATUS,
  MOCK_RECENT_ORDERS,
  MOCK_SALES_OVERVIEW,
  MOCK_STOCK_STATUS,
  MOCK_TOP_PRODUCTS,
} from '../data/mock-reports';
import { SalesOverviewChart } from './sales-overview-chart';
import { StatusDonutChart } from './status-donut-chart';

const PERIOD_OPTIONS = [
  { id: '30d', label: 'Últimos 30 Dias' },
  { id: '3m', label: 'Últimos 3 Meses' },
  { id: '6m', label: 'Últimos 6 Meses' },
  { id: 'year', label: 'Ano Atual' },
] as const;

export function ReportsLayout() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);

  const selectedPeriodLabel =
    PERIOD_OPTIONS.find((p) => p.id === selectedPeriod)?.label ?? 'Últimos 6 Meses';

  const handleDownloadReport = () => {
    toast({
      variant: 'success',
      title: 'Relatório exportado',
      description: 'O relatório em PDF foi gerado e o download começará em instantes.',
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-6 gap-6 bg-[#F7F7F7]">
      {/* SEÇÃO HEADER: Título e Controles */}
      <div className="flex shrink-0 items-center justify-between select-none">
        <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Relatório</h1>

        <div className="flex items-center gap-3">
          {/* Popover / Select Período */}
          <Popover open={isPeriodOpen} onOpenChange={setIsPeriodOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-4 text-sm font-semibold text-[#171717] hover:bg-black/[0.02] cursor-pointer transition-colors shadow-2xs"
              >
                <span>{selectedPeriodLabel}</span>
                <ChevronDownIcon className="size-4 text-[#737373]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 flex-col gap-1 p-1.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedPeriod(opt.id);
                    setIsPeriodOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer',
                    opt.id === selectedPeriod
                      ? 'bg-primary/5 font-bold text-primary'
                      : 'text-[#171717] hover:bg-black/[0.04]',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Botão Baixar */}
          <button
            type="button"
            onClick={handleDownloadReport}
            className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-4 text-sm font-semibold text-[#171717] hover:bg-black/[0.02] cursor-pointer transition-colors shadow-2xs"
          >
            <DownloadIcon className="size-4 text-[#171717]" />
            <span>Baixar</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: CARDS DE KPI (4 Colunas) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
        {MOCK_KPI_CARDS.map((card) => {
          const isPositive = card.isPositive;
          return (
            <div
              key={card.id}
              className="flex flex-col justify-between rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-2xs"
            >
              {/* Topo do Card: Ícone badge na cor primária do PDV (#171717) + Título */}
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#171717] text-white shadow-xs shrink-0">
                  {card.iconName === 'order' && <ShoppingBagIcon className="size-5" />}
                  {card.iconName === 'revenue' && <DollarSignIcon className="size-5" />}
                  {card.iconName === 'customer' && <UsersIcon className="size-5" />}
                  {card.iconName === 'new_customer' && <UserPlusIcon className="size-5" />}
                </div>
                <span className="text-sm font-semibold text-[#525252]">{card.title}</span>
              </div>

              {/* Valor + Pílula de Variação % */}
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold tracking-tight text-[#171717]">
                  {card.value}
                </span>

                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                    isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
                  )}
                >
                  <span>{card.change}</span>
                  {isPositive ? (
                    <TrendingUpIcon className="size-3.5" />
                  ) : (
                    <TrendingDownIcon className="size-3.5" />
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEÇÃO 2: VISÃO GERAL DE VENDAS & TOP 10 PRODUTOS (2 Colunas) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Visão Geral de Vendas (7 colunas) */}
        <div className="flex flex-col rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-2xs lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#171717]">Visão Geral de Vendas</h2>
          </div>
          <SalesOverviewChart data={MOCK_SALES_OVERVIEW} />
        </div>

        {/* Top 10 Produtos (5 colunas) */}
        <div className="flex flex-col rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-2xs lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#171717]">Top 10 Produtos</h2>
          </div>

          <div className="flex flex-col overflow-hidden">
            {/* Cabeçalho da Tabela */}
            <div className="grid grid-cols-[50px_1fr_80px] items-center border-b border-[#E5E5E5] pb-2 text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
              <div>#</div>
              <div>Produto</div>
              <div className="text-right">Vendas</div>
            </div>

            {/* Lista dos 10 Produtos */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-[#F0F0F0]">
              {MOCK_TOP_PRODUCTS.map((prod) => {
                const rankColorClass =
                  prod.rank === 1
                    ? 'bg-[#22c55e] text-white'
                    : prod.rank === 2
                      ? 'bg-amber-500 text-white'
                      : prod.rank === 3
                        ? 'bg-sky-500 text-white'
                        : 'bg-[#E5E5E5] text-[#737373]';

                return (
                  <div
                    key={prod.rank}
                    className="grid grid-cols-[50px_1fr_80px] items-center py-2.5 text-xs text-[#171717]"
                  >
                    {/* Badge do Ranking */}
                    <div className="flex items-center">
                      <span
                        className={cn(
                          'flex size-7 items-center justify-center rounded-full text-xs font-bold shadow-2xs',
                          rankColorClass,
                        )}
                      >
                        {prod.rank <= 3 ? <TrophyIcon className="size-3.5" /> : prod.rank}
                      </span>
                    </div>

                    {/* Imagem + Nome */}
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]">
                        {prod.imageUrl ? (
                          <Image
                            src={prod.imageUrl}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-[#D4D4D4]">
                            <ImageIcon className="size-4" strokeWidth={1.5} />
                          </span>
                        )}
                      </div>
                      <span className="truncate font-semibold text-[#171717]">{prod.name}</span>
                    </div>

                    {/* Qtd de Vendas */}
                    <div className="text-right font-bold text-[#171717]">
                      {prod.salesCount.toLocaleString('pt-BR')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: STATUS DOS PRODUTOS & STATUS DO ESTOQUE (2 Donut Charts) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Status do Produto */}
        <div className="flex flex-col rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#171717]">Status do Produto</h2>
            <button
              type="button"
              onClick={() =>
                toast({ variant: 'info', title: 'Status dos produtos', description: 'Visualizando lista de status.' })
              }
              className="text-xs font-semibold text-[#737373] hover:text-[#171717] transition-colors cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <StatusDonutChart
            total={MOCK_PRODUCT_STATUS.total}
            totalLabel="Total de Produtos"
            items={[
              { label: 'Ativo', count: MOCK_PRODUCT_STATUS.active, color: '#22c55e' },
              { label: 'Inativo', count: MOCK_PRODUCT_STATUS.inactive, color: '#f59e0b' },
              { label: 'Rascunho', count: MOCK_PRODUCT_STATUS.draft, color: '#3b82f6' },
            ]}
          />
        </div>

        {/* Status do Estoque */}
        <div className="flex flex-col rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-2xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#171717]">Status do Estoque</h2>
            <button
              type="button"
              onClick={() =>
                toast({ variant: 'info', title: 'Status do estoque', description: 'Visualizando lista de estoque.' })
              }
              className="text-xs font-semibold text-[#737373] hover:text-[#171717] transition-colors cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <StatusDonutChart
            total={MOCK_STOCK_STATUS.total}
            totalLabel="Total de Itens"
            items={[
              { label: 'Em estoque', count: MOCK_STOCK_STATUS.inStock, color: '#22c55e' },
              { label: 'Estoque baixo', count: MOCK_STOCK_STATUS.lowStock, color: '#f59e0b' },
              {
                label: 'Sem estoque',
                count: MOCK_STOCK_STATUS.outOfStock,
                color: '#ef4444',
                hasWarningIcon: true,
              },
            ]}
          />
        </div>
      </div>

      {/* SEÇÃO 4: PEDIDOS RECENTES */}
      <div className="flex flex-col rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#171717]">Pedidos Recentes</h2>
          <button
            type="button"
            onClick={() =>
              toast({ variant: 'info', title: 'Pedidos recentes', description: 'Redirecionando para tela de pedidos.' })
            }
            className="text-xs font-semibold text-[#737373] hover:text-[#171717] transition-colors cursor-pointer"
          >
            Ver todos
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[10px] font-bold uppercase tracking-wider text-[#A3A3A3]">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Data do Pedido</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Tipo de Pedido</th>
                <th className="py-3 px-4 text-center">Qtd</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {MOCK_RECENT_ORDERS.map((order, idx) => {
                const statusPill =
                  order.status === 'in_progress' ? (
                    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      Em Andamento
                    </span>
                  ) : order.status === 'open' ? (
                    <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      Aberto
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Concluído
                    </span>
                  );

                return (
                  <tr key={`${order.id}-${idx}`} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#171717]">{order.id}</td>
                    <td className="py-3.5 px-4">{statusPill}</td>
                    <td className="py-3.5 px-4 font-medium text-[#525252] whitespace-pre-line">
                      {order.orderDate}
                    </td>
                    <td className="py-3.5 px-4">
                      {order.customerName ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#171717] bg-[#F5F5F5] px-2.5 py-1 rounded-xl">
                          <span>{order.customerName}</span>
                          <span className="text-[10px] text-[#737373]">↗</span>
                        </span>
                      ) : (
                        <span className="text-[#A3A3A3] font-medium">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#171717]">{order.orderType}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-[#171717]">
                      {order.qty ?? '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#171717]">
                      {order.totalCents
                        ? `R$ ${(order.totalCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-lg text-[#737373] hover:bg-black/[0.05] hover:text-[#171717] cursor-pointer transition-colors"
                          >
                            <MoreVerticalIcon className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() =>
                              toast({
                                variant: 'info',
                                title: order.id,
                                description: 'Ver detalhes do pedido.',
                              })
                            }
                          >
                            Ver detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
