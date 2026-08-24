'use client';

import { useState } from 'react';
import { Box, Skeleton, Stack, Typography } from '@citybox/mui/atoms';
import { ActiveListingsCard } from './active-listings-card';
import { DealsCard } from './deals-card';
import { FeaturedPropertyCard } from './featured-property-card';
import { LeadsContactCard } from './leads-contact-card';
import { MetricsOverview } from './metrics-overview';
import { PerformanceCard } from './performance-card';
import { RemindersCard } from './reminders-card';
import { CalendarMiniPanel } from '@/features/calendar/components/calendar-mini-panel';
import { useDashboardOverviewQuery } from '../hooks/use-dashboard-queries';
import type { PerformancePeriod } from '../types';

/** Composição da tela — layout alinhado ao Figma Listify (gap 20px). */
export function DashboardPage() {
  const [period, setPeriod] = useState<PerformancePeriod>('monthly');
  const { data: overview, isLoading, isError } =
    useDashboardOverviewQuery(period);

  if (isError) {
    return (
      <Typography color="error" role="alert">
        Não foi possível carregar o dashboard. Tente novamente.
      </Typography>
    );
  }

  const modules = overview?.modules;
  const showMetrics = isLoading || (overview && overview.metrics.length > 0);
  const showPerformance =
    isLoading || modules?.finance || modules?.calendar;
  const showFeatured = isLoading || modules?.properties;
  const showDeals = isLoading || modules?.transactions;
  const showListings = isLoading || modules?.properties;
  const showCalendar = isLoading || modules?.calendar;
  const showReminders =
    isLoading ||
    modules?.leads ||
    modules?.calendar ||
    (overview && overview.reminders.length > 0);
  const showLeads = isLoading || modules?.leads;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: {
          xs: '1fr',
          xl: 'minmax(0, 1fr) minmax(280px, 360px)',
        },
        alignItems: 'start',
      }}
    >
      <Stack spacing={2.5} sx={{ minWidth: 0 }}>
        {showMetrics ? (
          isLoading || !overview ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
          ) : overview.metrics.length > 0 ? (
            <MetricsOverview metrics={overview.metrics} />
          ) : null
        ) : null}

        {showPerformance || showFeatured ? (
          <Box
            sx={{
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: {
                xs: '1fr',
                lg:
                  showPerformance && showFeatured
                    ? '1fr 1fr'
                    : '1fr',
              },
              alignItems: 'stretch',
            }}
          >
            {showPerformance ? (
              <PerformanceCard
                series={overview?.performance}
                period={period}
                onPeriodChange={setPeriod}
                isLoading={isLoading}
              />
            ) : null}
            {showFeatured ? <FeaturedPropertyCard /> : null}
          </Box>
        ) : null}

        {showDeals ? (
          isLoading || !overview ? (
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <Box sx={{ minWidth: 0 }}>
              <DealsCard deals={overview.deals} />
            </Box>
          )
        ) : null}

        {showListings ? (
          isLoading || !overview ? (
            <Skeleton
              variant="rounded"
              height={280}
              sx={{ borderRadius: 2, width: '100%' }}
            />
          ) : (
            <ActiveListingsCard listings={overview.listings} />
          )
        ) : null}
      </Stack>

      {showCalendar || showReminders || showLeads ? (
        <Box
          component="aside"
          sx={{
            display: 'grid',
            gap: 2.5,
            alignItems: 'start',
            minWidth: 0,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'minmax(0, 1fr) minmax(0, 1fr)',
              xl: '1fr',
            },
            '& > *': {
              minWidth: 0,
              width: '100%',
            },
          }}
        >
          {showCalendar ? <CalendarMiniPanel /> : null}
          {isLoading || !overview ? (
            <>
              {showReminders ? (
                <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
              ) : null}
              {showLeads ? (
                <Skeleton
                  variant="rounded"
                  height={280}
                  sx={{
                    borderRadius: 2,
                    gridColumn: { xs: 'auto', sm: '1 / -1', xl: 'auto' },
                  }}
                />
              ) : null}
            </>
          ) : (
            <>
              {showReminders ? (
                <RemindersCard reminders={overview.reminders} />
              ) : null}
              {showLeads ? (
                <Box
                  sx={{
                    gridColumn: { xs: 'auto', sm: '1 / -1', xl: 'auto' },
                    width: '100%',
                  }}
                >
                  <LeadsContactCard leads={overview.leads} />
                </Box>
              ) : null}
            </>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
