import type {
  PermissionGroup,
  PermissionSubgroup,
} from "@/features/users-permissions/types/permission-profile";

export function subgroupItemIds(subgroup: PermissionSubgroup): string[] {
  return subgroup.items.map((item) => item.id);
}

export function groupItemIds(group: PermissionGroup): string[] {
  return group.subgroups.flatMap(subgroupItemIds);
}

export function countSelected(ids: string[], selected: ReadonlySet<string>): number {
  return ids.filter((id) => selected.has(id)).length;
}

export function groupSelectionState(
  group: PermissionGroup,
  selected: ReadonlySet<string>,
): { selectedCount: number; total: number; checked: boolean; indeterminate: boolean } {
  const ids = groupItemIds(group);
  const selectedCount = countSelected(ids, selected);
  return {
    selectedCount,
    total: ids.length,
    checked: ids.length > 0 && selectedCount === ids.length,
    indeterminate: selectedCount > 0 && selectedCount < ids.length,
  };
}

export function scopeTotals(
  groups: PermissionGroup[],
  selected: ReadonlySet<string>,
): { selectedCount: number; total: number } {
  const ids = groups.flatMap(groupItemIds);
  return { selectedCount: countSelected(ids, selected), total: ids.length };
}

/** Alterna todos os itens de um grupo — liga tudo se algo faltava, desliga tudo se já estava completo. */
export function toggleGroupIds(
  group: PermissionGroup,
  selected: ReadonlySet<string>,
): Set<string> {
  const ids = groupItemIds(group);
  const { checked } = groupSelectionState(group, selected);
  const next = new Set(selected);
  ids.forEach((id) => (checked ? next.delete(id) : next.add(id)));
  return next;
}

export function toggleScopeIds(
  groups: PermissionGroup[],
  selected: ReadonlySet<string>,
): Set<string> {
  const ids = groups.flatMap(groupItemIds);
  const { selectedCount, total } = scopeTotals(groups, selected);
  const allSelected = total > 0 && selectedCount === total;
  const next = new Set(selected);
  ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
  return next;
}

export function toggleItemId(id: string, selected: ReadonlySet<string>): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

/**
 * Filtra a árvore pelo texto buscado — mantém apenas subgrupos/itens que
 * casam (por label) e descarta grupos que ficarem vazios.
 */
export function filterPermissionGroups(
  groups: PermissionGroup[],
  search: string,
): PermissionGroup[] {
  const query = search.trim().toLowerCase();
  if (!query) return groups;

  return groups
    .map((group) => {
      const subgroups = group.subgroups
        .map((subgroup) => ({
          ...subgroup,
          items: subgroup.items.filter((item) =>
            item.label.toLowerCase().includes(query) ||
            subgroup.label.toLowerCase().includes(query) ||
            group.label.toLowerCase().includes(query),
          ),
        }))
        .filter((subgroup) => subgroup.items.length > 0);
      return { ...group, subgroups };
    })
    .filter((group) => group.subgroups.length > 0);
}
