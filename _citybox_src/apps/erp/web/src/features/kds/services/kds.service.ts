import { MOCK_KDS } from "@/features/kds/data/mock-kds";
import type {
  Kds,
  KdsFormValues,
  KdsListParams,
  KdsListResult,
  KdsStatus,
} from "@/features/kds/types/kds";

/**
 * Store in-memory — a `erp-comercio-api` ainda não tem módulo de KDS.
 *
 * O array é sempre substituído (nunca mutado): a referência serve de snapshot
 * para o `useSyncExternalStore` das telas, que só re-renderizam quando ela muda.
 */
let kdsStore: Kds[] = MOCK_KDS.map((item) => ({
  ...item,
  productIds: [...item.productIds],
}));

let createdCounter = 0;

const listeners = new Set<() => void>();

export function subscribeKds(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getKdsSnapshot(): Kds[] {
  return kdsStore;
}

function commit(next: Kds[]): void {
  kdsStore = next;
  listeners.forEach((listener) => listener());
}

function matchesSearch(item: Kds, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return item.name.toLowerCase().includes(query);
}

/** Filtro + ordenação + paginação sobre um snapshot (função pura). */
export function selectKdsList(
  items: Kds[],
  params: KdsListParams,
): KdsListResult {
  const filtered = items
    .filter((item) => item.deletedAt == null)
    .filter((item) => matchesSearch(item, params.search));
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / params.perPage));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.perPage;

  return {
    data: sorted.slice(start, start + params.perPage),
    meta: { total, page, perPage: params.perPage, totalPages },
  };
}

export function selectKdsById(items: Kds[], id: string): Kds | undefined {
  return items.find((item) => item.id === id && item.deletedAt == null);
}

export function createKds(values: KdsFormValues): Kds {
  createdCounter += 1;
  const created: Kds = {
    id: `kds-new-${createdCounter}`,
    name: values.name.trim(),
    status: values.status,
    isExpedition: values.isExpedition,
    productIds: [],
    deletedAt: null,
  };
  commit([created, ...kdsStore]);
  return created;
}

function replaceKds(id: string, update: (current: Kds) => Kds): Kds | undefined {
  const current = kdsStore.find((item) => item.id === id);
  if (!current || current.deletedAt != null) return undefined;

  const updated = update(current);
  commit(kdsStore.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export function updateKds(id: string, values: KdsFormValues): Kds | undefined {
  return replaceKds(id, (current) => ({
    ...current,
    name: values.name.trim(),
    status: values.status,
    isExpedition: values.isExpedition,
  }));
}

export function setKdsStatus(id: string, status: KdsStatus): Kds | undefined {
  return replaceKds(id, (current) => ({ ...current, status }));
}

export function deleteKds(id: string): Kds | undefined {
  return replaceKds(id, (current) => ({
    ...current,
    deletedAt: new Date().toISOString(),
  }));
}

/** Vincula produtos ao KDS, ignorando os que já estavam vinculados. */
export function addKdsProducts(id: string, productIds: string[]): Kds | undefined {
  return replaceKds(id, (current) => ({
    ...current,
    productIds: [...new Set([...current.productIds, ...productIds])],
  }));
}

export function removeKdsProduct(id: string, productId: string): Kds | undefined {
  return replaceKds(id, (current) => ({
    ...current,
    productIds: current.productIds.filter((item) => item !== productId),
  }));
}
