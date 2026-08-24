/** Ordem pedida pelo form; ids que faltam vão ao fim; ids desconhecidos saem. */
export function resolvePhotoOrder(
  currentIds: readonly string[],
  requestedIds: readonly string[],
): string[] {
  const current = new Set(currentIds);
  const seen = new Set<string>();
  const next: string[] = [];

  for (const id of requestedIds) {
    if (!current.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }

  for (const id of currentIds) {
    if (seen.has(id)) continue;
    next.push(id);
  }

  return next;
}
