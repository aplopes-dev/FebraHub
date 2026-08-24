import type { QueryClient } from '@tanstack/react-query';

/**
 * Queries do dashboard (`clinic-dashboard…`) e dos relatórios (`clinic`/`reports`).
 * Invalidar após mutações financeiras e após mudança de status/remoção de consulta
 * (Tarefas · Consultas canceladas e cards de indicadores).
 */
export function invalidateClinicDashboardQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({
    predicate: (query) => {
      const root = query.queryKey[0];
      return typeof root === 'string' && root.startsWith('clinic-dashboard');
    },
  });
  void queryClient.invalidateQueries({
    predicate: (query) => {
      const [scope, kind] = query.queryKey;
      return scope === 'clinic' && kind === 'reports';
    },
  });
}
