import type { DashboardCashflowEntry } from '../types/clinic-dashboard';

/**
 * Mix de liquidados (paidAt ≤ hoje), previstos (dueDate > hoje),
 * overdue e pagamentos futuros — estes dois últimos são excluídos pelo filtro.
 */
export const MOCK_DASHBOARD_CASHFLOW: DashboardCashflowEntry[] = [
  // 2026-07 liquidados (income)
  { id: 'cf-001', side: 'income', dueDate: '2026-07-02', paidAt: '2026-07-02', valueCents: 1_250_000 },
  { id: 'cf-002', side: 'income', dueDate: '2026-07-05', paidAt: '2026-07-05', valueCents: 890_000 },
  { id: 'cf-003', side: 'income', dueDate: '2026-07-08', paidAt: '2026-07-08', valueCents: 1_450_000 },
  { id: 'cf-004', side: 'income', dueDate: '2026-07-10', paidAt: '2026-07-10', valueCents: 720_000 },
  { id: 'cf-005', side: 'income', dueDate: '2026-07-14', paidAt: '2026-07-14', valueCents: 980_000 },
  { id: 'cf-006', side: 'income', dueDate: '2026-07-18', paidAt: '2026-07-18', valueCents: 1_100_000 },
  // 2026-07 liquidados (expense)
  { id: 'cf-007', side: 'expense', dueDate: '2026-07-03', paidAt: '2026-07-03', valueCents: 320_000 },
  { id: 'cf-008', side: 'expense', dueDate: '2026-07-07', paidAt: '2026-07-07', valueCents: 180_500 },
  { id: 'cf-009', side: 'expense', dueDate: '2026-07-12', paidAt: '2026-07-12', valueCents: 450_000 },
  { id: 'cf-010', side: 'expense', dueDate: '2026-07-16', paidAt: '2026-07-16', valueCents: 210_398 },
  // 2026-07 previstos (dueDate > 2026-07-20)
  { id: 'cf-011', side: 'income', dueDate: '2026-07-22', paidAt: null, valueCents: 1_350_000 },
  { id: 'cf-012', side: 'income', dueDate: '2026-07-25', paidAt: null, valueCents: 780_000 },
  { id: 'cf-013', side: 'income', dueDate: '2026-07-28', paidAt: null, valueCents: 920_000 },
  { id: 'cf-014', side: 'expense', dueDate: '2026-07-23', paidAt: null, valueCents: 290_000 },
  { id: 'cf-015', side: 'expense', dueDate: '2026-07-27', paidAt: null, valueCents: 155_000 },
  { id: 'cf-016', side: 'expense', dueDate: '2026-07-30', paidAt: null, valueCents: 175_000 },
  // Overdue (excluídos) — dueDate < today, unpaid
  { id: 'cf-017', side: 'income', dueDate: '2026-07-01', paidAt: null, valueCents: 500_000 },
  { id: 'cf-018', side: 'expense', dueDate: '2026-06-28', paidAt: null, valueCents: 100_000 },
  // Pagamento futuro (excluído) — paidAt > today
  { id: 'cf-019', side: 'income', dueDate: '2026-07-15', paidAt: '2026-07-25', valueCents: 300_000 },
  // Outros meses 2026
  { id: 'cf-020', side: 'income', dueDate: '2026-01-10', paidAt: '2026-01-10', valueCents: 2_100_000 },
  { id: 'cf-021', side: 'expense', dueDate: '2026-01-15', paidAt: '2026-01-15', valueCents: 680_000 },
  { id: 'cf-022', side: 'income', dueDate: '2026-02-08', paidAt: '2026-02-08', valueCents: 1_850_000 },
  { id: 'cf-023', side: 'expense', dueDate: '2026-02-12', paidAt: '2026-02-12', valueCents: 540_000 },
  { id: 'cf-024', side: 'income', dueDate: '2026-03-05', paidAt: '2026-03-05', valueCents: 2_050_000 },
  { id: 'cf-025', side: 'expense', dueDate: '2026-03-18', paidAt: '2026-03-18', valueCents: 710_000 },
  { id: 'cf-026', side: 'income', dueDate: '2026-04-09', paidAt: '2026-04-09', valueCents: 1_920_000 },
  { id: 'cf-027', side: 'expense', dueDate: '2026-04-20', paidAt: '2026-04-20', valueCents: 490_000 },
  { id: 'cf-028', side: 'income', dueDate: '2026-05-06', paidAt: '2026-05-06', valueCents: 2_200_000 },
  { id: 'cf-029', side: 'expense', dueDate: '2026-05-14', paidAt: '2026-05-14', valueCents: 630_000 },
  { id: 'cf-030', side: 'income', dueDate: '2026-06-04', paidAt: '2026-06-04', valueCents: 1_780_000 },
  { id: 'cf-031', side: 'expense', dueDate: '2026-06-11', paidAt: '2026-06-11', valueCents: 520_000 },
  { id: 'cf-032', side: 'income', dueDate: '2026-06-20', paidAt: '2026-06-20', valueCents: 1_450_000 },
  { id: 'cf-033', side: 'expense', dueDate: '2026-06-25', paidAt: '2026-06-25', valueCents: 380_000 },
  { id: 'cf-034', side: 'income', dueDate: '2026-08-05', paidAt: null, valueCents: 1_600_000 },
  { id: 'cf-035', side: 'expense', dueDate: '2026-08-12', paidAt: null, valueCents: 400_000 },
  { id: 'cf-036', side: 'income', dueDate: '2026-09-10', paidAt: null, valueCents: 1_750_000 },
  { id: 'cf-037', side: 'expense', dueDate: '2026-09-18', paidAt: null, valueCents: 450_000 },
  { id: 'cf-038', side: 'income', dueDate: '2026-10-07', paidAt: null, valueCents: 1_900_000 },
  { id: 'cf-039', side: 'expense', dueDate: '2026-10-15', paidAt: null, valueCents: 510_000 },
  { id: 'cf-040', side: 'income', dueDate: '2026-11-03', paidAt: null, valueCents: 1_680_000 },
  { id: 'cf-041', side: 'expense', dueDate: '2026-11-20', paidAt: null, valueCents: 470_000 },
  { id: 'cf-042', side: 'income', dueDate: '2026-12-02', paidAt: null, valueCents: 2_000_000 },
  { id: 'cf-043', side: 'expense', dueDate: '2026-12-10', paidAt: null, valueCents: 550_000 },
  // 2025
  { id: 'cf-044', side: 'income', dueDate: '2025-11-12', paidAt: '2025-11-12', valueCents: 1_500_000 },
  { id: 'cf-045', side: 'expense', dueDate: '2025-11-20', paidAt: '2025-11-20', valueCents: 420_000 },
  { id: 'cf-046', side: 'income', dueDate: '2025-12-05', paidAt: '2025-12-05', valueCents: 1_800_000 },
  { id: 'cf-047', side: 'expense', dueDate: '2025-12-15', paidAt: '2025-12-15', valueCents: 600_000 },
  { id: 'cf-048', side: 'income', dueDate: '2025-12-22', paidAt: '2025-12-22', valueCents: 950_000 },
  { id: 'cf-049', side: 'expense', dueDate: '2025-12-28', paidAt: '2025-12-28', valueCents: 280_000 },
];
