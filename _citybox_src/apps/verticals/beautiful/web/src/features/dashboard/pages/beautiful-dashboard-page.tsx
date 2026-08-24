'use client';

import { Box, Grid, Stack } from '@citybox/mui/atoms';
import { alpha } from '@mui/material/styles';
import { useDashboardData } from '../hooks/use-dashboard-data';
import { DashboardDayTicket } from '../components/dashboard-day-ticket';
import { DashboardAppointmentsCard } from '../components/dashboard-appointments-card';
import { DashboardShortcutsCard } from '../components/dashboard-shortcuts-card';
import { DashboardFinancialCard } from '../components/dashboard-financial-card';
import { DashboardStockSummaryCard } from '../components/dashboard-stock-summary-card';

export function BeautifulDashboardPage() {
  const {
    ticketDate,
    canAccessSchedule,
    canAccessFinancial,
    canAccessStock,
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
  } = useDashboardData();

  const nextValue = loadingAppointments ? '…' : stats.next ? stats.next.startTime : 'Sem mais hoje';

  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        minWidth: 0,
        pb: 8,
        backgroundImage:
          theme.palette.mode === 'dark'
            ? 'none'
            : `radial-gradient(1100px 480px at 8% -10%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 55%)`,
      })}
    >
      <DashboardDayTicket
        ticketDate={ticketDate}
        cells={[
          {
            label: 'Atendimentos hoje',
            value: loadingAppointments ? '…' : String(stats.total),
            subtitle: `${stats.completed} concluídos · ${stats.active} em aberto · ${stats.cancelled} cancelados · ${stats.noShow} faltas`,
            icon: 'calendar',
            tone: 'primary',
          },
          {
            label: 'Próximo atendimento',
            value: nextValue,
            subtitle: stats.next
              ? `${stats.next.clientName} · ${stats.next.serviceName}`
              : 'Nenhum agendamento pendente',
            icon: 'clock',
            tone: 'warning',
            compactValue: !stats.next,
          },
          {
            label: 'Clientes cadastrados',
            value: String(totalClients),
            subtitle: 'Base de clientes da unidade',
            icon: 'users',
            tone: 'success',
          },
          {
            label: 'Receita prevista hoje',
            value: loadingFinancial ? '…' : formatCurrencyBRL(totalRevenue),
            subtitle: `${formatCurrencyBRL(receivedRevenue)} já recebidos`,
            icon: 'wallet',
            tone: 'primary',
          },
        ]}
      />

      <Grid container spacing={3.25} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3.25}>
            {canAccessSchedule ? (
              <DashboardAppointmentsCard
                appointments={stats.sortedAll}
                isLoading={loadingAppointments}
                isError={appointmentsError}
              />
            ) : null}

            <DashboardShortcutsCard shortcuts={shortcuts} />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.75}>
            {canAccessFinancial ? (
              <DashboardFinancialCard
                totalRevenue={formatCurrencyBRL(totalRevenue)}
                receivedRevenue={formatCurrencyBRL(receivedRevenue)}
                pendingRevenue={formatCurrencyBRL(pendingRevenue)}
                ticketMedio={formatCurrencyBRL(ticketMedio)}
                isLoading={loadingFinancial}
              />
            ) : null}

            {canAccessStock ? (
              <DashboardStockSummaryCard
                productCount={stockProductCount}
                alertCount={stockAlertCount}
              />
            ) : null}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
