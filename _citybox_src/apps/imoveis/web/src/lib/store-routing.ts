import { IMOVEL_VIEW_PERMISSION, hasVerticalViewPermission } from './vertical-permissions';

/** Única vertical servida por este app. */
export const IMOVEL_VERTICAL_ID = 'imoveis';

export type StoreOption = {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  role?: string;
  /** IDs CASL da loja (`@citybox/imoveis-permissions`). */
  permissions?: string[];
  isOrganizationOwner?: boolean;
  memberId?: string;
  /** Slug do corretor na loja (perfil + catálogo público). */
  agentId?: string;
};

export function verticalModulePath(_vertical?: string): string {
  return '/';
}

export function resolveStoreSwitchNavigation(
  _pendingVertical: string,
  currentPathname: string,
): 'reload' | { href: string } {
  const root = verticalModulePath();
  return currentPathname === root ? 'reload' : { href: root };
}

export function verticalPermission(vertical: string): string {
  if (vertical === IMOVEL_VERTICAL_ID) return IMOVEL_VIEW_PERMISSION;
  return `vertical.${vertical}.view`;
}

export function verticalLabel(vertical: string): string {
  if (vertical === IMOVEL_VERTICAL_ID) return 'Imóveis';
  return vertical;
}

export function canAccessStoreVertical(
  permissions: string[],
  vertical: string,
): boolean {
  return hasVerticalViewPermission(permissions, verticalPermission(vertical));
}

/**
 * Lojas utilizáveis neste app — vertical Imóveis + permissão `vertical_access`.
 */
export function filterAccessibleStores(
  stores: StoreOption[],
  permissions: string[],
): StoreOption[] {
  return stores.filter(
    (store) =>
      store.vertical === IMOVEL_VERTICAL_ID &&
      canAccessStoreVertical(permissions, store.vertical),
  );
}

export function groupStoresByVertical(
  stores: StoreOption[],
): Array<[vertical: string, stores: StoreOption[]]> {
  const map = new Map<string, StoreOption[]>();
  for (const store of stores) {
    const bucket = map.get(store.vertical) ?? [];
    bucket.push(store);
    map.set(store.vertical, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => verticalLabel(a).localeCompare(verticalLabel(b), 'pt-BR'))
    .map(
      ([vertical, list]) =>
        [
          vertical,
          list.sort((x, y) => x.name.localeCompare(y.name, 'pt-BR')),
        ] as const,
    );
}
