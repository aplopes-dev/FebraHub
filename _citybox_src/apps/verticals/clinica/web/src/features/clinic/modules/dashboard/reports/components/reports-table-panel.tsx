'use client';

import type {
  ReportBudgetPeriodMode,
  ReportId,
  ReportPeriodFilter,
} from '../types/clinic-reports';
import {
  ReportsApprovedBudgetsTable,
  ReportsOpenBudgetsTable,
  ReportsRejectedBudgetsTable,
} from './reports-approved-budgets-table';
import { ReportsBirthdaysTable } from './reports-birthdays-table';
import { ReportsExcludedRevenuesTable } from './reports-excluded-revenues-table';
import { ReportsExpensesByCategoryTable } from './reports-expenses-by-category-table';
import { ReportsOpenTreatmentsWithoutAppointmentTable } from './reports-open-treatments-without-appointment-table';
import { ReportsReferredPatientsTable } from './reports-referred-patients-table';
import { ReportsSalesByPlanTable } from './reports-sales-by-plan-table';
import { ReportsSalesByProfessionalTable } from './reports-sales-by-professional-table';
import { ReportsSalesBySpecialtyTable } from './reports-sales-by-specialty-table';
import { ReportsSalesByTreatmentTable } from './reports-sales-by-treatment-table';

type ReportsTablePanelProps = {
  reportId: ReportId;
  period: ReportPeriodFilter;
  budgetPeriodMode: ReportBudgetPeriodMode;
  budgetMonth: number;
  budgetYear: number;
};

export function ReportsTablePanel({
  reportId,
  period,
  budgetPeriodMode,
  budgetMonth,
  budgetYear,
}: ReportsTablePanelProps) {
  if (reportId === 'birthdays') {
    return <ReportsBirthdaysTable period={period} />;
  }

  if (reportId === 'open_treatments_without_appointment') {
    return <ReportsOpenTreatmentsWithoutAppointmentTable />;
  }

  if (reportId === 'approved_budgets') {
    return (
      <ReportsApprovedBudgetsTable
        budgetPeriodMode={budgetPeriodMode}
        budgetMonth={budgetMonth}
        budgetYear={budgetYear}
      />
    );
  }

  if (reportId === 'open_budgets') {
    return (
      <ReportsOpenBudgetsTable
        budgetPeriodMode={budgetPeriodMode}
        budgetMonth={budgetMonth}
        budgetYear={budgetYear}
      />
    );
  }

  if (reportId === 'rejected_budgets') {
    return (
      <ReportsRejectedBudgetsTable
        budgetPeriodMode={budgetPeriodMode}
        budgetMonth={budgetMonth}
        budgetYear={budgetYear}
      />
    );
  }

  if (reportId === 'sales_by_specialty') {
    return (
      <ReportsSalesBySpecialtyTable
        budgetPeriodMode={budgetPeriodMode}
        budgetMonth={budgetMonth}
        budgetYear={budgetYear}
      />
    );
  }

  if (reportId === 'sales_by_plan') {
    return (
      <ReportsSalesByPlanTable
        budgetPeriodMode={budgetPeriodMode}
        budgetMonth={budgetMonth}
        budgetYear={budgetYear}
      />
    );
  }

  if (reportId === 'sales_by_professional') {
    return (
      <ReportsSalesByProfessionalTable
        budgetPeriodMode={budgetPeriodMode}
        budgetMonth={budgetMonth}
        budgetYear={budgetYear}
      />
    );
  }

  if (reportId === 'sales_by_treatment') {
    return (
      <ReportsSalesByTreatmentTable
        budgetPeriodMode={budgetPeriodMode}
        budgetMonth={budgetMonth}
        budgetYear={budgetYear}
      />
    );
  }

  if (reportId === 'expenses_by_category') {
    return (
      <ReportsExpensesByCategoryTable
        budgetPeriodMode={budgetPeriodMode}
        budgetMonth={budgetMonth}
        budgetYear={budgetYear}
      />
    );
  }

  if (reportId === 'excluded_revenues') {
    return <ReportsExcludedRevenuesTable period={period} />;
  }

  if (reportId === 'referred_patients') {
    return (
      <ReportsReferredPatientsTable
        budgetPeriodMode={budgetPeriodMode}
        budgetMonth={budgetMonth}
        budgetYear={budgetYear}
      />
    );
  }

  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      Tabela deste relatório em breve.
    </p>
  );
}
