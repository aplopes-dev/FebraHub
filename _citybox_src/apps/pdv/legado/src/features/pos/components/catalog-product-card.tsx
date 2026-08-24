'use client';

import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@citybox/ui';
import type { CatalogProduct } from '../types/catalog-product';
import { formatCatalogPrice } from '../data/placeholder-catalog-products';
import { usePosStore } from '../hooks/use-pos-store';

type CatalogProductCardProps = {
  product: CatalogProduct;
  onSelect?: (product: CatalogProduct) => void;
};

/**
 * Card de produto do grid do PDV (mín. 163.6px × 256; largura fluida no grid).
 */
export function CatalogProductCard({
  product,
  onSelect,
}: CatalogProductCardProps) {
  const items = usePosStore((state) => state.items);
  
  // Calcular a quantidade deste produto no carrinho
  const cartQuantity = items
    .filter((item) => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      type="button"
      className={cn(
        'pdv-product-card relative overflow-hidden transition-all',
        cartQuantity > 0 && 'shadow-xs'
      )}
      onClick={() => onSelect?.(product)}
    >
      <div className="pdv-product-card-image">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            unoptimized
            className="object-contain"
            sizes="164px"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[#d4d4d4]">
            <ImageIcon className="size-10" aria-hidden strokeWidth={1.25} />
          </span>
        )}
      </div>

      <div className="pdv-product-card-separator" aria-hidden />

      <div className="pdv-product-card-meta">
        <span className="pdv-product-card-name" title={product.name}>
          {product.name}
        </span>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-sm font-medium text-[#282828] leading-5">
            {formatCatalogPrice(product.priceCents)}
          </span>
          {cartQuantity > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground font-medium">x</span>
              <span
                className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                style={{ backgroundImage: 'var(--pdv-nav-active-gradient)' }}
              >
                {cartQuantity}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Barra de 6px com gradiente no rodapé interno do card */}
      {cartQuantity > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[6px] rounded-b-[inherit]"
          style={{ backgroundImage: 'var(--pdv-nav-active-gradient)' }}
        />
      )}
    </button>
  );
}
