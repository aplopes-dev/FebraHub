/** Path autenticado da capa do imóvel (1ª foto por `sortOrder`). */
export function propertyCoverPhotoPath(
  propertyId: string,
  photoId: string,
): string {
  return `/v1/properties/${propertyId}/photos/${photoId}`;
}

export function coverPhotoMapFromRows(
  rows: ReadonlyArray<{ propertyId: string; id: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (!map.has(row.propertyId)) {
      map.set(row.propertyId, propertyCoverPhotoPath(row.propertyId, row.id));
    }
  }
  return map;
}
