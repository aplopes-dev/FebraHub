import { MOCK_SERVICE_ORDER_STATUSES } from "@/features/service-orders/data/mock-service-order-statuses";
import type {
  ServiceOrderStatus,
  ServiceOrderStatusFormValues,
} from "@/features/service-orders/types/service-order-status";

let statusesStore: ServiceOrderStatus[] = MOCK_SERVICE_ORDER_STATUSES.map(
  (status) => ({ ...status }),
);

let createdCounter = 0;
let hydratedFromApi = false;

function sortBySortOrder(items: readonly ServiceOrderStatus[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Substitui o cache local pelos status da API (após fetch). */
export function hydrateServiceOrderStatuses(
  statuses: readonly ServiceOrderStatus[],
): void {
  statusesStore = statuses.map((status) => ({ ...status }));
  hydratedFromApi = true;
}

export function areServiceOrderStatusesHydrated(): boolean {
  return hydratedFromApi;
}

/** Todos os status, ordenados — inclui inativos (para o gerenciador). */
export function listAllServiceOrderStatuses(): ServiceOrderStatus[] {
  return sortBySortOrder(statusesStore);
}

/** Só status ativos — para selects de formulário. */
export function listActiveServiceOrderStatuses(): ServiceOrderStatus[] {
  return sortBySortOrder(statusesStore.filter((status) => status.active));
}

export function getServiceOrderStatusById(
  id: string,
): ServiceOrderStatus | undefined {
  return statusesStore.find((status) => status.id === id);
}

export function createEmptyServiceOrderStatusFormValues(): ServiceOrderStatusFormValues {
  return { name: "", baseType: "open", variant: "secondary", active: true };
}

export function serviceOrderStatusToFormValues(
  status: ServiceOrderStatus,
): ServiceOrderStatusFormValues {
  return {
    name: status.name,
    baseType: status.baseType,
    variant: status.variant,
    active: status.active,
  };
}

export function createServiceOrderStatus(
  values: ServiceOrderStatusFormValues,
): ServiceOrderStatus {
  createdCounter += 1;
  const status: ServiceOrderStatus = {
    id: `sos-new-${createdCounter}`,
    name: values.name.trim(),
    baseType: values.baseType,
    variant: values.variant,
    active: values.active,
    sortOrder: statusesStore.length,
  };
  statusesStore = [...statusesStore, status];
  return status;
}

export function updateServiceOrderStatus(
  id: string,
  values: ServiceOrderStatusFormValues,
): ServiceOrderStatus | undefined {
  const current = statusesStore.find((status) => status.id === id);
  if (!current) return undefined;

  const updated: ServiceOrderStatus = {
    ...current,
    name: values.name.trim(),
    baseType: values.baseType,
    variant: values.variant,
    active: values.active,
  };
  statusesStore = statusesStore.map((status) =>
    status.id === id ? updated : status,
  );
  return updated;
}

export function removeServiceOrderStatus(id: string): boolean {
  const exists = statusesStore.some((status) => status.id === id);
  if (!exists) return false;
  statusesStore = statusesStore
    .filter((status) => status.id !== id)
    .map((status, index) => ({ ...status, sortOrder: index }));
  return true;
}

/** Reordena conforme a lista de ids recebida (ids ausentes vão para o fim). */
export function reorderServiceOrderStatuses(orderedIds: string[]): void {
  const position = new Map(orderedIds.map((id, index) => [id, index]));
  statusesStore = sortBySortOrder(statusesStore)
    .sort(
      (a, b) =>
        (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (position.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    )
    .map((status, index) => ({ ...status, sortOrder: index }));
}
