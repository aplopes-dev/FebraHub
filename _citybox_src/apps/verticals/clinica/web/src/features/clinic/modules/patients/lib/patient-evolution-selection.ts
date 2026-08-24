export function selectAllEvolutionIds(evolutionIds: readonly string[]): string[] {
  return [...evolutionIds];
}

export function toggleEvolutionSelection(
  selectedIds: readonly string[],
  evolutionId: string,
): string[] {
  if (selectedIds.includes(evolutionId)) {
    return selectedIds.filter((id) => id !== evolutionId);
  }

  return [...selectedIds, evolutionId];
}

export function isAllEvolutionsSelected(
  allEvolutionIds: readonly string[],
  selectedIds: readonly string[],
): boolean {
  if (allEvolutionIds.length === 0) {
    return false;
  }

  return allEvolutionIds.every((id) => selectedIds.includes(id));
}

export function isSomeEvolutionsSelected(
  allEvolutionIds: readonly string[],
  selectedIds: readonly string[],
): boolean {
  if (selectedIds.length === 0) {
    return false;
  }

  return !isAllEvolutionsSelected(allEvolutionIds, selectedIds);
}

export function filterEvolutionsByIds<T extends { id: string }>(
  evolutions: readonly T[],
  selectedIds: readonly string[],
): T[] {
  const selectedSet = new Set(selectedIds);
  return evolutions.filter((evolution) => selectedSet.has(evolution.id));
}
