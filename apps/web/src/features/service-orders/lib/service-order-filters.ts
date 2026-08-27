import type { ServiceOrderListFilters } from "@/features/service-orders/types/service-order";

export function createEmptyServiceOrderFilters(): ServiceOrderListFilters {
  return {
    statusIds: [],
    technicianName: null,
    openedFrom: null,
    openedTo: null,
  };
}

/** Quantos grupos de filtro estão ativos (badge do botão Filtro). */
export function countActiveServiceOrderFilters(
  filters: ServiceOrderListFilters,
): number {
  let count = 0;
  if (filters.statusIds.length > 0) count += 1;
  if (filters.technicianName) count += 1;
  if (filters.openedFrom || filters.openedTo) count += 1;
  return count;
}
