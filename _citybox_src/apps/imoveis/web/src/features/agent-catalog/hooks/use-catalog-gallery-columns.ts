'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import {
  countCatalogGalleryColumnsPerRow,
  CATALOG_GALLERY_MAX_VISIBLE,
} from '@/features/shared/utils/catalog-gallery-display';

export function useCatalogGalleryColumns(
  containerRef: RefObject<HTMLElement | null>,
): number {
  const [columnsPerRow, setColumnsPerRow] = useState(CATALOG_GALLERY_MAX_VISIBLE);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    function updateColumns() {
      const width = element?.getBoundingClientRect().width ?? 0;
      setColumnsPerRow(countCatalogGalleryColumnsPerRow(width));
    }

    updateColumns();

    const observer = new ResizeObserver(updateColumns);
    observer.observe(element);

    return () => observer.disconnect();
  }, [containerRef]);

  return columnsPerRow;
}
