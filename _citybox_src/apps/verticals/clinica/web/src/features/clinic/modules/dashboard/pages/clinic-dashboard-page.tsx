'use client';

import { useMemo, useState } from 'react';
import { buildOverdueIncomeCashFlowHref } from '../lib/cash-flow-deep-link';
import { useDashboardSummaryQuery } from '../hooks/use-dashboard-summary-query';
import { DashboardBirthdaysDialog } from '../components/dashboard-birthdays-dialog';
import { DashboardBudgetsCard } from '../components/dashboard-budgets-card';
import { DashboardBudgetsDialog } from '../components/dashboard-budgets-dialog';
import { DashboardAppointmentsCard } from '../components/dashboard-appointments-card';
import { DashboardCashflowCard } from '../components/dashboard-cashflow-card';
import { DashboardCommissionsCard } from '../components/dashboard-commissions-card';
import { DashboardPaymentMethodsCard } from '../components/dashboard-payment-methods-card';
import { DashboardKpiCards } from '../components/dashboard-kpi-cards';
import { DashboardPageFrame } from '../components/dashboard-page-frame';
import { DashboardRevenueAnalysisCard } from '../components/dashboard-revenue-analysis-card';
import { DashboardFinancialCard } from '../components/dashboard-financial-card';
import { DashboardPatientsCard } from '../components/dashboard-patients-card';
import { DashboardSalesGoalsCard } from '../components/dashboard-sales-goals-card';
import { DashboardPatientAcquisitionCard } from '../components/dashboard-patient-acquisition-card';
import { DashboardPatientDemographicsCard } from '../components/dashboard-patient-demographics-card';
import { DashboardTicketMedioCard } from '../components/dashboard-ticket-medio-card';
import { DashboardInadimplenciaCard } from '../components/dashboard-inadimplencia-card';
import { DashboardExpenseByCategoryCard } from '../components/dashboard-expense-by-category-card';

export function ClinicDashboardPage() {
  const [budgetsOpen, setBudgetsOpen] = useState(false);
  const [birthdaysOpen, setBirthdaysOpen] = useState(false);

  const {
    overdueIncomeTotalCents,
    openRejectedBudgetsTotalCents,
    upcomingBirthdaysCount,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useDashboardSummaryQuery();

  const overdueHref = useMemo(() => buildOverdueIncomeCashFlowHref(), []);

  return (
    <DashboardPageFrame>
      <div className="space-y-4">
        <DashboardKpiCards
          overdueIncomeTotalCents={overdueIncomeTotalCents}
          openRejectedBudgetsTotalCents={openRejectedBudgetsTotalCents}
          upcomingBirthdaysCount={upcomingBirthdaysCount}
          overdueHref={overdueHref}
          overdueIncomeLoading={summaryLoading}
          overdueIncomeError={summaryError}
          openRejectedBudgetsLoading={summaryLoading}
          openRejectedBudgetsError={summaryError}
          upcomingBirthdaysLoading={summaryLoading}
          upcomingBirthdaysError={summaryError}
          onOpenBudgets={() => setBudgetsOpen(true)}
          onOpenBirthdays={() => setBirthdaysOpen(true)}
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
          <DashboardRevenueAnalysisCard className="h-full" />
          <div className="flex min-w-0 flex-col gap-4">
            <DashboardFinancialCard />
            <DashboardPatientsCard
              upcomingBirthdaysCount={upcomingBirthdaysCount}
              upcomingBirthdaysLoading={summaryLoading}
              upcomingBirthdaysError={summaryError}
            />
          </div>
        </div>

        <DashboardSalesGoalsCard />

        <DashboardBudgetsCard />

        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <DashboardPatientAcquisitionCard />
          <DashboardPatientDemographicsCard />
        </div>

        <DashboardAppointmentsCard />

        <DashboardCashflowCard />

        <DashboardCommissionsCard />

        <DashboardPaymentMethodsCard />

        <DashboardTicketMedioCard />

        <DashboardInadimplenciaCard />

        <DashboardExpenseByCategoryCard />
      </div>

      <DashboardBudgetsDialog
        open={budgetsOpen}
        onOpenChange={setBudgetsOpen}
      />

      <DashboardBirthdaysDialog
        open={birthdaysOpen}
        onOpenChange={setBirthdaysOpen}
      />
    </DashboardPageFrame>
  );
}
