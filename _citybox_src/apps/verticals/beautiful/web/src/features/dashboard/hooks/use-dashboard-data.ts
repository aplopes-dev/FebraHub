import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAbility, useCan } from '@/features/permissions';
import { useStore } from '@/lib/store-context';
import { firstAllowedCatalogPath } from '@/lib/beautiful-nav-permissions';
import { useAppointmentsQuery } from '@/features/agenda/hooks/use-appointments-queries';
import { useClientsQuery } from '@/features/clients/hooks/use-clients-queries';
import { useProductsQuery } from '@/features/catalog/hooks/use-catalog-queries';
import {
  FINANCIAL_ENTRIES_KEY,
  useFinancialStatsQuery,
} from '@/features/financeiro/hooks/use-financial-queries';
import { financialService } from '@/features/financeiro/services/financial-service';
import { formatCurrencyBRL, todayIso } from '@/features/agenda/utils/agenda-date';
import { formatTicketDate } from '../utils/format-ticket-date';
import type { DashboardShortcut } from '../types/dashboard.types';

export function useDashboardData() {
  const ability = useAbility();
  const { storeId, stores } = useStore();
  const activeStore = stores.find((s) => s.id === storeId);
  const permissions = activeStore?.permissions ?? [];
  const isOwner = activeStore?.isOrganizationOwner === true;

  const canAccessSchedule = useCan('access', 'Schedule');
  const canAccessClients = useCan('read', 'Client');
  const canAccessStockPerm = useCan('access', 'Stock');
  const canReadProduct = useCan('read', 'Product');
  const canAccessStock = canAccessStockPerm || canReadProduct;
  const canAccessFinancial = useCan('access', 'Financial');
  const canAccessTeam = useCan('read', 'Team');

  const catalogPath = firstAllowedCatalogPath(permissions, isOwner) ?? '/catalogo';
  const today = todayIso();

  // Queries
  const {
    data: appointments = [],
    isPending: loadingAppointments,
    isError: appointmentsError,
  } = useAppointmentsQuery(
    { from: today, to: today },
    { enabled: canAccessSchedule },
  );

  const { data: clientsPage } = useClientsQuery({ page: 1, perPage: 1 });
  const totalClients = clientsPage?.stats.totalClients ?? clientsPage?.meta.total ?? 0;

  const { data: productsPage } = useProductsQuery(
    { page: 1, perPage: 1 },
    canAccessStock,
  );
  const stockStats = productsPage?.stats;
  const stockProductCount = stockStats?.totalProducts ?? productsPage?.meta.total ?? 0;
  const stockAlertCount = (stockStats?.lowStock ?? 0) + (stockStats?.outOfStock ?? 0);

  const {
    data: financialStats,
    isPending: loadingFinancialStats,
  } = useFinancialStatsQuery(
    { startDate: today, endDate: today },
    { enabled: canAccessFinancial },
  );

  const {
    data: incomeCountPage,
    isPending: loadingIncomeCount,
  } = useQuery({
    queryKey: [...FINANCIAL_ENTRIES_KEY, 'dashboard-income-count', today],
    queryFn: () =>
      financialService.entries.list({
        startDate: today,
        endDate: today,
        dateField: 'dueDate',
        types: 'income',
        statuses: 'pending,received',
        page: 1,
        perPage: 1,
      }),
    enabled: canAccessFinancial,
  });

  const loadingFinancial = canAccessFinancial && (loadingFinancialStats || loadingIncomeCount);

  // Shortcuts list based on permissions
  const shortcuts = useMemo<DashboardShortcut[]>(
    () =>
      [
        {
          href: '/agenda',
          title: 'Novo agendamento',
          description: 'Agendar horário na agenda',
          icon: 'plus' as const,
          allowed: canAccessSchedule,
        },
        {
          href: '/clientes',
          title: 'Novo cliente',
          description: 'Cadastrar cliente na base',
          icon: 'user' as const,
          allowed: canAccessClients,
        },
        {
          href: catalogPath,
          title: 'Catálogo de serviços',
          description: 'Gerenciar serviços da unidade',
          icon: 'tag' as const,
          allowed:
            ability?.can('read', 'Service') === true ||
            ability?.can('read', 'Product') === true ||
            canAccessStock,
        },
        {
          href: '/catalogo/estoque',
          title: 'Registrar estoque',
          description: 'Entrada e retirada de insumos',
          icon: 'boxes' as const,
          allowed: canAccessStock,
        },
        {
          href: '/financeiro/fluxo-de-caixa',
          title: 'Fluxo de caixa',
          description: 'Receitas, despesas e lançamentos',
          icon: 'wallet' as const,
          allowed: canAccessFinancial,
        },
        {
          href: '/equipe',
          title: 'Gerenciar equipe',
          description: 'Equipe, horários e permissões',
          icon: 'users' as const,
          allowed: canAccessTeam,
        },
      ].filter((item) => item.allowed),
    [canAccessSchedule, canAccessClients, catalogPath, ability, canAccessStock, canAccessFinancial, canAccessTeam],
  );

  // Calculate statistics from appointments
  const stats = useMemo(() => {
    const active = appointments.filter(
      (item) =>
        item.status === 'SCHEDULED' ||
        item.status === 'CONFIRMED' ||
        item.status === 'IN_PROGRESS',
    );
    const completed = appointments.filter((item) => item.status === 'COMPLETED');
    const cancelled = appointments.filter((item) => item.status === 'CANCELLED');
    const noShow = appointments.filter((item) => item.status === 'NO_SHOW');

    const sortedActive = [...active].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const now = new Date();
    const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const next = sortedActive.find((a) => a.startTime >= currentHHmm) ?? sortedActive[0] ?? null;

    return {
      total: appointments.length,
      active: active.length,
      completed: completed.length,
      cancelled: cancelled.length,
      noShow: noShow.length,
      next,
      sortedAll: [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    };
  }, [appointments]);

  const incomeCount = incomeCountPage?.pagination.total ?? 0;
  const totalRevenue = financialStats?.income.total ?? 0;
  const receivedRevenue = financialStats?.income.received ?? 0;
  const pendingRevenue = financialStats?.income.toReceive ?? 0;
  const ticketMedio = incomeCount > 0 ? totalRevenue / incomeCount : 0;

  return {
    today,
    ticketDate: formatTicketDate(today),
    canAccessSchedule,
    canAccessFinancial,
    canAccessStock,
    appointments,
    loadingAppointments,
    appointmentsError,
    loadingFinancial,
    totalClients,
    stockProductCount,
    stockAlertCount,
    shortcuts,
    stats,
    totalRevenue,
    receivedRevenue,
    pendingRevenue,
    ticketMedio,
    formatCurrencyBRL,
  };
}
