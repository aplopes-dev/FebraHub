import { getModule } from '@/lib/modules';
import { hasVerticalViewPermission } from '@/lib/vertical-permissions';
import type { ClinicStrand } from '@citybox/messaging/clinic-strand';

/** Única vertical servida por este app. */
export const CLINIC_VERTICAL_ID = 'clinic';

export type StoreOption = {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  clinicStrand?: ClinicStrand;
  /** IDs CASL da clínica (`@citybox/clinica-permissions`). */
  permissions?: string[];
  isOrganizationOwner?: boolean;
  /** `Member.id` do usuário na clínica (mesmo id usado como professionalId na agenda). */
  memberId?: string;
};

/**
 * Rota inicial do backoffice. App dedicado à clínica — sempre a raiz.
 * Assinatura mantida para paridade com o ERP multi-vertical.
 */
export function verticalModulePath(_vertical?: string): string {
  return '/';
}

/**
 * Navegação após confirmar troca de clínica.
 *
 * Volta sempre para a raiz em vez de recarregar a rota atual: páginas de detalhe
 * (`/pacientes/:id`, `/marketing/campaigns/:id`) referenciam registros da loja
 * anterior e resultariam em 404 após a troca. Na raiz, `reload` basta.
 */
export function resolveStoreSwitchNavigation(
  _pendingVertical: string,
  currentPathname: string,
): 'reload' | { href: string } {
  const root = verticalModulePath();
  return currentPathname === root ? 'reload' : { href: root };
}

export function verticalPermission(vertical: string): string {
  if (vertical === CLINIC_VERTICAL_ID) return 'vertical_access';
  return `vertical.${vertical}.view`;
}

export function verticalLabel(vertical: string): string {
  return getModule(vertical)?.label ?? vertical;
}

export function canAccessStoreVertical(permissions: string[], vertical: string): boolean {
  return hasVerticalViewPermission(permissions, verticalPermission(vertical));
}

export type FilterStoresOptions = {
  /** IDs de loja na plataforma onde o usuário está vinculado */
  assignedStoreIds?: string[];
};

/**
 * Lojas utilizáveis neste app: apenas as da vertical clínica **e** com permissão.
 * Lojas de outras verticais ficam de fora — pertencem aos respectivos ERPs.
 */
export function filterAccessibleStores(
  stores: StoreOption[],
  permissions: string[],
  options?: FilterStoresOptions,
): StoreOption[] {
  const isClinicAndAllowed = (store: StoreOption) =>
    store.vertical === CLINIC_VERTICAL_ID && canAccessStoreVertical(permissions, store.vertical);

  const assigned = options?.assignedStoreIds;
  if (assigned !== undefined) {
    const ids = new Set(assigned);
    return stores.filter((s) => ids.has(s.id) && isClinicAndAllowed(s));
  }

  return stores.filter(isClinicAndAllowed);
}

/** Agrupa lojas por vertical para combobox com separadores (optgroup). */
export function groupStoresByVertical(stores: StoreOption[]): Array<[vertical: string, stores: StoreOption[]]> {
  const map = new Map<string, StoreOption[]>();
  for (const store of stores) {
    const bucket = map.get(store.vertical) ?? [];
    bucket.push(store);
    map.set(store.vertical, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => verticalLabel(a).localeCompare(verticalLabel(b), 'pt-BR'))
    .map(([vertical, list]) => [vertical, list.sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'))] as const);
}
