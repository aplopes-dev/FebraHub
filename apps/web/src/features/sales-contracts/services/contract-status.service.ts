import { MOCK_CONTRACT_STATUSES } from "@/features/sales-contracts/data/mock-contract-statuses";
import type {
  ContractStatus,
  ContractStatusFormValues,
  ContractStatusListParams,
  ContractStatusListResult,
} from "@/features/sales-contracts/types/contract-status";

let statusesStore: ContractStatus[] = MOCK_CONTRACT_STATUSES.map((status) => ({
  ...status,
}));

function matchesSearch(item: ContractStatus, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return item.name.toLowerCase().includes(q);
}

function sortedByOrder(items: ContractStatus[]): ContractStatus[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listAllContractStatuses(): ContractStatus[] {
  return sortedByOrder(statusesStore);
}

export function listActiveContractStatuses(): ContractStatus[] {
  return sortedByOrder(statusesStore.filter((item) => item.active));
}

export function getContractStatusById(id: string): ContractStatus | null {
  return statusesStore.find((item) => item.id === id) ?? null;
}

export function listContractStatuses(
  params: ContractStatusListParams,
): ContractStatusListResult {
  const filtered = statusesStore.filter((item) =>
    matchesSearch(item, params.search),
  );
  const sorted = sortedByOrder(filtered);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.perPage;
  const data = sorted.slice(start, start + params.perPage);

  return {
    data,
    meta: {
      total,
      page,
      perPage: params.perPage,
      totalPages,
    },
  };
}

function normalizeValues(
  values: ContractStatusFormValues,
): ContractStatusFormValues {
  return {
    name: values.name.trim(),
    variant: values.variant,
    active: values.active,
  };
}

export function createContractStatus(
  values: ContractStatusFormValues,
): ContractStatus {
  const maxOrder = statusesStore.reduce(
    (max, item) => Math.max(max, item.sortOrder),
    -1,
  );
  const status: ContractStatus = {
    id: `contract-status-${crypto.randomUUID().slice(0, 8)}`,
    sortOrder: maxOrder + 1,
    ...normalizeValues(values),
  };
  statusesStore = [...statusesStore, status];
  return status;
}

export function updateContractStatus(
  id: string,
  values: ContractStatusFormValues,
): ContractStatus | null {
  const index = statusesStore.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const updated: ContractStatus = {
    ...statusesStore[index],
    ...normalizeValues(values),
  };

  statusesStore = [
    ...statusesStore.slice(0, index),
    updated,
    ...statusesStore.slice(index + 1),
  ];

  return updated;
}

export function removeContractStatus(id: string): boolean {
  const exists = statusesStore.some((item) => item.id === id);
  if (!exists) return false;
  statusesStore = statusesStore.filter((item) => item.id !== id);
  return true;
}

export function reorderContractStatuses(orderedIds: string[]): void {
  const byId = new Map(statusesStore.map((item) => [item.id, item]));
  const reordered: ContractStatus[] = [];

  orderedIds.forEach((id, index) => {
    const item = byId.get(id);
    if (!item) return;
    reordered.push({ ...item, sortOrder: index });
    byId.delete(id);
  });

  // Append any leftovers preserving relative order
  const leftovers = sortedByOrder([...byId.values()]).map((item, index) => ({
    ...item,
    sortOrder: reordered.length + index,
  }));

  statusesStore = [...reordered, ...leftovers];
}

export function createEmptyContractStatusFormValues(): ContractStatusFormValues {
  return {
    name: "",
    variant: "secondary",
    active: true,
  };
}

export function contractStatusToFormValues(
  status: ContractStatus,
): ContractStatusFormValues {
  return {
    name: status.name,
    variant: status.variant,
    active: status.active,
  };
}
