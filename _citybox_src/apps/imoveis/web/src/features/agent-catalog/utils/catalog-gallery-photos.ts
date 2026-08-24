import type { CatalogListing } from '../types';

/** Galeria pública: capa primeiro, depois o restante sem duplicar. */
export function catalogGalleryPhotos(
  listing: Pick<CatalogListing, 'coverPhotoUrl' | 'photoUrls'>,
): string[] {
  const urls = listing.photoUrls ?? [];
  const cover = listing.coverPhotoUrl;
  if (!cover) return [...urls];
  return [cover, ...urls.filter((url) => url !== cover)];
}
