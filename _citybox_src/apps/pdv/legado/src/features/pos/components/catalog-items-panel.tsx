'use client';

import { useMemo, useState } from 'react';
import { ScrollArea } from '@citybox/ui/atoms';
import {
  PLACEHOLDER_CATALOG_PRODUCTS,
} from '../data/placeholder-catalog-products';
import { usePosUi } from '../hooks/use-pos-ui';
import type { CatalogMenu } from '../types/catalog-menu';
import { ALL_MENUS_ID } from '../types/catalog-menu';
import type { CatalogProduct } from '../types/catalog-product';
import { CatalogProductCard } from './catalog-product-card';
import { ProductCustomizeModal } from './product-customize-modal';

type CatalogItemsPanelProps = {
  menus: readonly CatalogMenu[];
};

/**
 * Coluna direita: grade com 5 produtos por linha.
 * Scroll overlay via ScrollArea (barra na margem do container).
 */
export function CatalogItemsPanel({ menus }: CatalogItemsPanelProps) {
  const { activeCatalogMenuId, searchQuery } = usePosUi();
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeMenu =
    menus.find((menu) => menu.id === activeCatalogMenuId) ?? menus[0];
  const filterLabel =
    activeCatalogMenuId === ALL_MENUS_ID
      ? 'Todos os itens'
      : (activeMenu?.name ?? 'Itens');

  const products = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase('pt-BR');

    return PLACEHOLDER_CATALOG_PRODUCTS.filter((product) => {
      const matchesMenu =
        activeCatalogMenuId === ALL_MENUS_ID ||
        product.menuId === activeCatalogMenuId;
      if (!matchesMenu) return false;
      if (!normalizedSearch) return true;
      return product.name.toLocaleLowerCase('pt-BR').includes(normalizedSearch);
    });
  }, [activeCatalogMenuId, searchQuery]);

  const handleProductSelect = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <section
      aria-label={`Itens — ${filterLabel}`}
      className="flex min-h-0 flex-1 flex-col overflow-hidden pl-2"
    >
      <ScrollArea
        type="scroll"
        className="pdv-product-scroll min-h-0 flex-1 overscroll-none [&>[data-slot=scroll-area-viewport]>div]:!block [&>[data-slot=scroll-area-viewport]>div]:min-w-0 [&>[data-slot=scroll-area-viewport]>div]:w-full"
      >
        {/* pr-5 reserva a margem direita para a scrollbar overlay */}
        <div className="py-4 pr-5">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum produto neste menu.
            </p>
          ) : (
            <div className="pdv-product-grid">
              {products.map((product) => (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleProductSelect}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <ProductCustomizeModal
        key={selectedProduct ? `${selectedProduct.id}-${isModalOpen}` : 'none'}
        product={selectedProduct}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </section>
  );
}

