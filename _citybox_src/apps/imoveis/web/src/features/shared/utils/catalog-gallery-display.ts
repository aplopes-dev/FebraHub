export const CATALOG_GALLERY_MAX_VISIBLE = 5;
export const CATALOG_PHOTO_TILE_SIZE_PX = 156;
export const CATALOG_PHOTO_TILE_GAP_PX = 18;

export type CatalogGalleryDisplay = {
  visiblePhotos: string[];
  showMoreTile: boolean;
  hiddenCount: number;
  moreOpensAtIndex: number;
};

/** Quantos tiles de 156px cabem em uma linha do container. */
export function countCatalogGalleryColumnsPerRow(containerWidthPx: number): number {
  if (containerWidthPx <= 0) {
    return 1;
  }

  const { tileSize, gap } = {
    tileSize: CATALOG_PHOTO_TILE_SIZE_PX,
    gap: CATALOG_PHOTO_TILE_GAP_PX,
  };

  return Math.max(
    1,
    Math.floor((containerWidthPx + gap) / (tileSize + gap)),
  );
}

/**
 * Catálogo público: preenche a primeira linha com tiles de 156px.
 * Quando há mais fotos do que cabem na linha, reserva o último slot para "Mais fotos".
 * Em coluna única (mobile): 1 foto + "Mais fotos" se existirem outras.
 * Nunca mais slots na grade do que `CATALOG_GALLERY_MAX_VISIBLE` (par do form).
 */
export function getPublicCatalogGalleryDisplay(
  photos: readonly string[],
  columnsPerRow: number,
): CatalogGalleryDisplay {
  const cols = Math.min(
    Math.max(1, columnsPerRow),
    CATALOG_GALLERY_MAX_VISIBLE,
  );

  if (photos.length === 0) {
    return {
      visiblePhotos: [],
      showMoreTile: false,
      hiddenCount: 0,
      moreOpensAtIndex: 0,
    };
  }

  if (photos.length <= cols) {
    return {
      visiblePhotos: [...photos],
      showMoreTile: false,
      hiddenCount: 0,
      moreOpensAtIndex: 0,
    };
  }

  // 1 coluna: 1 thumbnail + botão; N colunas: N-1 thumbnails + botão
  const visibleCount = cols === 1 ? 1 : cols - 1;

  return {
    visiblePhotos: photos.slice(0, visibleCount),
    showMoreTile: true,
    hiddenCount: photos.length - visibleCount,
    moreOpensAtIndex: visibleCount,
  };
}

/** Quais itens exibir antes do botão "Mais fotos" (form de imóveis — limite fixo). */
export function getCatalogGalleryDisplay(
  photos: readonly string[],
): CatalogGalleryDisplay {
  if (photos.length <= CATALOG_GALLERY_MAX_VISIBLE) {
    return {
      visiblePhotos: [...photos],
      showMoreTile: false,
      hiddenCount: 0,
      moreOpensAtIndex: 0,
    };
  }

  const visibleCount = CATALOG_GALLERY_MAX_VISIBLE - 1;

  return {
    visiblePhotos: photos.slice(0, visibleCount),
    showMoreTile: true,
    hiddenCount: photos.length - visibleCount,
    moreOpensAtIndex: visibleCount,
  };
}
