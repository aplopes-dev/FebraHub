'use client';

import { PLACEHOLDER_CATALOG_MENUS } from '../data/placeholder-catalog-menus';
import { CatalogItemsPanel } from './catalog-items-panel';
import { CatalogMenuNav } from './catalog-menu-nav';

/**
 * Área do catálogo abaixo do header: menus (col. 1) + itens filtrados (col. 2).
 */
export function CatalogPanel() {
  const menus = PLACEHOLDER_CATALOG_MENUS;

  return (
    <section
      aria-label="Catálogo"
      className="flex min-h-0 flex-1 overflow-hidden"
    >
      <CatalogMenuNav menus={menus} />
      <CatalogItemsPanel menus={menus} />
    </section>
  );
}
