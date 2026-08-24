import type {
  DashboardBirthdayPatient,
  DashboardBudgetRow,
  DashboardOverdueIncome,
  DashboardSummary,
} from '../types/clinic-dashboard';
import { daysUntilNextBirthday } from './dashboard-dates';

export function sumOverdueIncomeCents(entries: DashboardOverdueIncome[]): number {
  return entries.reduce((sum, entry) => sum + entry.valueCents, 0);
}

export function sumOpenRejectedBudgetsCents(budgets: DashboardBudgetRow[]): number {
  return budgets
    .filter((b) => b.status === 'open' || b.status === 'rejected')
    .reduce((sum, b) => sum + b.valueCents, 0);
}

export function countUpcomingBirthdays(
  patients: DashboardBirthdayPatient[],
  referenceDate: Date = new Date(),
  withinDays = 30,
): number {
  return patients.filter((patient) => {
    if (patient.status !== 'active') return false;
    const days = daysUntilNextBirthday(patient.birthDate, referenceDate);
    return days !== null && days >= 0 && days <= withinDays;
  }).length;
}

export function buildDashboardSummary(params: {
  overdueIncomes: DashboardOverdueIncome[];
  budgets: DashboardBudgetRow[];
  birthdayPatients: DashboardBirthdayPatient[];
  referenceDate?: Date;
}): DashboardSummary {
  const referenceDate = params.referenceDate ?? new Date();

  return {
    overdueIncomeTotalCents: sumOverdueIncomeCents(params.overdueIncomes),
    openRejectedBudgetsTotalCents: sumOpenRejectedBudgetsCents(params.budgets),
    upcomingBirthdaysCount: countUpcomingBirthdays(
      params.birthdayPatients,
      referenceDate,
      30,
    ),
  };
}
