export function photosInCoverOrder<T extends { sortOrder: number }>(
  photos: readonly T[],
): T[] {
  return [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
}
