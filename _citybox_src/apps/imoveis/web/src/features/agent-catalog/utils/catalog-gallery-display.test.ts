import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CATALOG_GALLERY_MAX_VISIBLE,
  CATALOG_PHOTO_TILE_GAP_PX,
  CATALOG_PHOTO_TILE_SIZE_PX,
  countCatalogGalleryColumnsPerRow,
  getCatalogGalleryDisplay,
  getPublicCatalogGalleryDisplay,
} from '@/features/shared/utils/catalog-gallery-display';

describe('countCatalogGalleryColumnsPerRow', () => {
  it('calcula colunas com tile 156px e gap 18px', () => {
    const widthForFour =
      4 * CATALOG_PHOTO_TILE_SIZE_PX + 3 * CATALOG_PHOTO_TILE_GAP_PX;
    assert.equal(countCatalogGalleryColumnsPerRow(widthForFour), 4);
    assert.equal(countCatalogGalleryColumnsPerRow(widthForFour + 20), 4);
    assert.equal(countCatalogGalleryColumnsPerRow(widthForFour + 174), 5);
  });

  it('retorna pelo menos 1 coluna', () => {
    assert.equal(countCatalogGalleryColumnsPerRow(0), 1);
    assert.equal(countCatalogGalleryColumnsPerRow(100), 1);
  });
});

describe('getPublicCatalogGalleryDisplay', () => {
  const photos = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('mostra todas quando cabem na linha', () => {
    const result = getPublicCatalogGalleryDisplay(photos.slice(0, 4), 4);

    assert.deepEqual(result.visiblePhotos, ['a', 'b', 'c', 'd']);
    assert.equal(result.showMoreTile, false);
  });

  it('reserva o último slot da linha para "Mais fotos" quando não cabe outra foto inteira', () => {
    const result = getPublicCatalogGalleryDisplay(photos, 4);

    assert.deepEqual(result.visiblePhotos, ['a', 'b', 'c']);
    assert.equal(result.showMoreTile, true);
    assert.equal(result.hiddenCount, 3);
    assert.equal(result.moreOpensAtIndex, 3);
  });

  it('em coluna única mostra 1 foto + "Mais fotos" quando há várias', () => {
    const result = getPublicCatalogGalleryDisplay(photos, 1);

    assert.deepEqual(result.visiblePhotos, ['a']);
    assert.equal(result.showMoreTile, true);
    assert.equal(result.hiddenCount, 5);
    assert.equal(result.moreOpensAtIndex, 1);
  });

  it('em coluna única com uma foto não mostra tile extra', () => {
    const result = getPublicCatalogGalleryDisplay(['a'], 1);

    assert.deepEqual(result.visiblePhotos, ['a']);
    assert.equal(result.showMoreTile, false);
  });
});

describe('getCatalogGalleryDisplay', () => {
  const photos = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  it('mostra todas quando há no máximo o limite', () => {
    const five = photos.slice(0, CATALOG_GALLERY_MAX_VISIBLE);
    const result = getCatalogGalleryDisplay(five);

    assert.deepEqual(result.visiblePhotos, five);
    assert.equal(result.showMoreTile, false);
    assert.equal(result.hiddenCount, 0);
  });

  it('reserva o último slot para "Mais fotos" quando excede o limite', () => {
    const result = getCatalogGalleryDisplay(photos);

    assert.deepEqual(result.visiblePhotos, ['a', 'b', 'c', 'd']);
    assert.equal(result.showMoreTile, true);
    assert.equal(result.hiddenCount, 4);
    assert.equal(result.moreOpensAtIndex, 4);
  });
});
