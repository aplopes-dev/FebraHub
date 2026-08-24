'use client';

import { useState } from 'react';
import { Stack, Typography } from '@citybox/mui/atoms';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TransactionsLayoutShell } from '@/features/transactions/components/transactions-layout-shell';
import { TransactionsReportsSection } from '@/features/transactions/components/transactions-reports-section';
import {
  useFinancialSummary,
  usePersonalCommissions,
  useRentalPayouts,
} from '../hooks/use-finance-queries';
import { isAgencySummary, isSingleAgentSummary } from '../types';
import {
  AgencyDrePanel,
  FinanceKpiGrid,
  LedgerTable,
} from './finance-kpi-grid';
import { PersonalCommissionsTable, RentalPayoutsTable } from './finance-tables';

type AgencyTab = 'dre' | 'commissions' | 'payouts';

const AGENCY_TABS = [
  { id: 'dre' as const, label: 'DRE', shortLabel: 'DRE' },
  {
    id: 'commissions' as const,
    label: 'Extrato de comissões',
    shortLabel: 'Extrato',
  },
  {
    id: 'payouts' as const,
    label: 'Repasses de locação',
    shortLabel: 'Repasses',
  },
] as const;

export function FinancePageContent() {
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const { data: commissions = [] } = usePersonalCommissions();
  const { data: payouts = [] } = useRentalPayouts();
  const [agencyTab, setAgencyTab] = useState<AgencyTab>('dre');

  const isAgency = summary && isAgencySummary(summary);
  const isSingle = summary && isSingleAgentSummary(summary);

  return (
    <TransactionsLayoutShell
      title="Financeiro"
      description="Receitas, comissões, repasses e relatórios consolidados."
    >
      <Stack spacing={{ xs: 2.5, sm: 4 }} sx={{ minWidth: 0, width: '100%' }}>
        <Stack spacing={{ xs: 2, sm: 3 }} sx={{ minWidth: 0, width: '100%' }}>
          {summary ? (
            <FinanceKpiGrid summary={summary} isLoading={summaryLoading} />
          ) : (
            <FinanceKpiGrid
              summary={{
                organizationType: 'AGENCY',
                grossRevenueCents: 0,
                commissionsToReleaseCents: 0,
                overdueRentalsCount: 0,
                estimatedNetProfitCents: 0,
                dre: {
                  revenueCents: 0,
                  commissionExpensesCents: 0,
                  adminFeesCents: 0,
                  operatingExpensesCents: 0,
                  netProfitCents: 0,
                },
              }}
              isLoading={summaryLoading}
            />
          )}

          {isSingle ? (
            <Stack spacing={1.5} sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontWeight: 500, fontSize: { xs: '1rem', sm: '1.125rem' } }}
              >
                Livro-caixa
              </Typography>
              <LedgerTable entries={summary.ledger} />
            </Stack>
          ) : null}

          {isAgency ? (
            <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ minWidth: 0, width: '100%' }}>
              <SegmentedControl
                aria-label="Abas do financeiro"
                items={AGENCY_TABS}
                value={agencyTab}
                onChange={setAgencyTab}
              />

              {agencyTab === 'dre' ? <AgencyDrePanel summary={summary} /> : null}
              {agencyTab === 'commissions' ? (
                <PersonalCommissionsTable entries={commissions} />
              ) : null}
              {agencyTab === 'payouts' ? <RentalPayoutsTable rows={payouts} /> : null}
            </Stack>
          ) : null}
        </Stack>

        <TransactionsReportsSection />
      </Stack>
    </TransactionsLayoutShell>
  );
}
