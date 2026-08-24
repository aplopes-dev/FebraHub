import type { PropertyPhotoDraft } from '../services/properties-service';
import { photoIdFromPath } from './property-media';

export function movePhotoToFront<T>(items: readonly T[], index: number): T[] {
  if (index <= 0 || index >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(index, 1);
  return [item, ...next];
}

export function reorderPhotosByKeys<T extends { key: string }>(
  items: readonly T[],
  orderedKeys: readonly string[],
): T[] {
  const byKey = new Map(items.map((item) => [item.key, item]));
  const next: T[] = [];
  for (const key of orderedKeys) {
    const item = byKey.get(key);
    if (item) next.push(item);
  }
  return next;
}

export function markPhotoUploaded(
  photos: readonly PropertyPhotoDraft[],
  key: string,
  path: string,
): PropertyPhotoDraft[] {
  return photos.map((photo) => {
    if (photo.key !== key) return photo;
    return {
      key: path,
      path,
      localPreview: photo.localPreview,
    };
  });
}

export function markPhotoUploadFailed(
  photos: readonly PropertyPhotoDraft[],
  key: string,
): PropertyPhotoDraft[] {
  return photos.map((photo) =>
    photo.key === key ? { ...photo, uploadFailed: true } : photo,
  );
}

export function photoIdsInFormOrder(
  photos: readonly PropertyPhotoDraft[],
): string[] {
  const ids: string[] = [];
  for (const photo of photos) {
    if (!photo.path) continue;
    const id = photoIdFromPath(photo.path);
    if (id) ids.push(id);
  }
  return ids;
}

export function draftsFromPhotoUrls(
  photoUrls: readonly string[],
): PropertyPhotoDraft[] {
  return photoUrls.map((path) => ({ key: path, path }));
}

export function firstNewPhotoPath(
  previousPaths: ReadonlySet<string>,
  nextPaths: readonly string[],
): string | null {
  return nextPaths.find((path) => !previousPaths.has(path)) ?? null;
}
