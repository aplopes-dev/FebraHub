import type { DashboardHoliday } from '../types/clinic-dashboard';

/**
 * Feriados nacionais BR (datas fixas) usados no cálculo de dias úteis do
 * card Metas de Vendas. Constante de domínio — não há endpoint de feriados
 * na clinica-api; ao virar o ano, acrescentar as datas do ano seguinte.
 */
export const BR_NATIONAL_HOLIDAYS: DashboardHoliday[] = [
  { date: '2025-01-01', name: 'Confraternização Universal' },
  { date: '2025-04-18', name: 'Paixão de Cristo' },
  { date: '2025-04-21', name: 'Tiradentes' },
  { date: '2025-05-01', name: 'Dia do Trabalho' },
  { date: '2025-09-07', name: 'Independência do Brasil' },
  { date: '2025-10-12', name: 'Nossa Senhora Aparecida' },
  { date: '2025-11-02', name: 'Finados' },
  { date: '2025-11-15', name: 'Proclamação da República' },
  { date: '2025-11-20', name: 'Consciência Negra' },
  { date: '2025-12-25', name: 'Natal' },
  { date: '2026-01-01', name: 'Confraternização Universal' },
  { date: '2026-04-03', name: 'Paixão de Cristo' },
  { date: '2026-04-21', name: 'Tiradentes' },
  { date: '2026-05-01', name: 'Dia do Trabalho' },
  { date: '2026-09-07', name: 'Independência do Brasil' },
  { date: '2026-10-12', name: 'Nossa Senhora Aparecida' },
  { date: '2026-11-02', name: 'Finados' },
  { date: '2026-11-15', name: 'Proclamação da República' },
  { date: '2026-11-20', name: 'Consciência Negra' },
  { date: '2026-12-25', name: 'Natal' },
];
