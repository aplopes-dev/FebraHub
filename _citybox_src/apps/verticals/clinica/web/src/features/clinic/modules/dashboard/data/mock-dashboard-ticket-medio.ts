import type { DashboardTicketMedioDayMetric } from '../types/clinic-dashboard';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Métricas diárias em ordem de grandeza de clínica (ticket/lucro diário),
 * para o eixo Y anual ficar em “50 mil / 100 mil…”, não em “milhões de mil”.
 */
function buildMonthMetrics(
  year: number,
  month: number,
  baseRevenue: number,
  baseExpense: number,
  basePatients: number,
): DashboardTicketMedioDayMetric[] {
  const rows: DashboardTicketMedioDayMetric[] = [];
  const dayCount = daysInMonth(year, month);

  for (let day = 1; day <= dayCount; day += 1) {
    const wave = 1 + 0.35 * Math.sin((day / dayCount) * Math.PI * 2);
    const weekendFactor = day % 7 === 0 || day % 7 === 6 ? 0.55 : 1;
    const revenueCents = Math.round(
      baseRevenue * wave * weekendFactor * (0.85 + (day % 5) * 0.04),
    );
    const expenseCents = Math.round(
      baseExpense * wave * weekendFactor * (0.9 + (day % 3) * 0.03),
    );
    const patientCount = Math.max(
      1,
      Math.round(basePatients * wave * weekendFactor),
    );
    rows.push({
      date: `${year}-${pad2(month)}-${pad2(day)}`,
      revenueCents,
      expenseCents,
      patientCount,
    });
  }
  return rows;
}

export const MOCK_DASHBOARD_TICKET_MEDIO: DashboardTicketMedioDayMetric[] = [
  ...buildMonthMetrics(2025, 1, 8_500_00, 3_200_00, 6),
  ...buildMonthMetrics(2025, 2, 9_000_00, 3_400_00, 6),
  ...buildMonthMetrics(2025, 3, 9_500_00, 3_600_00, 7),
  ...buildMonthMetrics(2025, 4, 9_200_00, 3_500_00, 7),
  ...buildMonthMetrics(2025, 5, 10_000_00, 3_800_00, 8),
  ...buildMonthMetrics(2025, 6, 10_500_00, 4_000_00, 8),
  ...buildMonthMetrics(2025, 7, 11_000_00, 4_200_00, 9),
  ...buildMonthMetrics(2025, 8, 10_800_00, 4_100_00, 9),
  ...buildMonthMetrics(2025, 9, 11_500_00, 4_400_00, 9),
  ...buildMonthMetrics(2025, 10, 11_200_00, 4_300_00, 9),
  ...buildMonthMetrics(2025, 11, 12_000_00, 4_600_00, 10),
  ...buildMonthMetrics(2025, 12, 12_500_00, 4_800_00, 10),
  ...buildMonthMetrics(2026, 1, 9_000_00, 3_500_00, 7),
  ...buildMonthMetrics(2026, 2, 9_500_00, 3_700_00, 7),
  ...buildMonthMetrics(2026, 3, 10_000_00, 3_900_00, 8),
  ...buildMonthMetrics(2026, 4, 10_500_00, 4_000_00, 8),
  ...buildMonthMetrics(2026, 5, 11_000_00, 4_200_00, 9),
  ...buildMonthMetrics(2026, 6, 11_500_00, 4_400_00, 9),
  ...buildMonthMetrics(2026, 7, 12_500_00, 4_800_00, 10),
  ...buildMonthMetrics(2026, 8, 12_000_00, 4_600_00, 10),
  ...buildMonthMetrics(2026, 9, 13_000_00, 5_000_00, 11),
  ...buildMonthMetrics(2026, 10, 12_800_00, 4_900_00, 10),
  ...buildMonthMetrics(2026, 11, 13_500_00, 5_200_00, 11),
  ...buildMonthMetrics(2026, 12, 14_000_00, 5_400_00, 12),
];
