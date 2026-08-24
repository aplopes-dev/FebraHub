import { useTranslation } from 'react-i18next';
import type { DecoratedProduct } from '@/types';
import { FavoriteButton } from '@/components/product/favorite-button';
import {
  FreeShippingLabel,
  ProductImage,
  ProductPriceBlock,
  RatingDisplay,
} from '@/components/product/product-primitives';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: DecoratedProduct;
  variant?: 'home' | 'search';
  onOpen: () => void;
}

export function ProductCard({ product, variant = 'home', onOpen }: ProductCardProps) {
  const { t } = useTranslation('catalog');

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className="relative flex cursor-pointer flex-col overflow-hidden rounded-[10px] border border-black/[0.08] bg-card"
    >
      <FavoriteButton productId={product.id} />
      <ProductImage product={product} className="aspect-square p-3.5" />
      <div className="flex flex-col gap-0.5 px-[13px] pt-3 pb-[15px]">
        {variant === 'search' ? (
          <>
            <span className="line-clamp-2 min-h-[34px] text-[13px] leading-snug text-[rgba(0,0,0,0.85)]">
              {product.title}
            </span>
            <RatingDisplay {...product} size="sm" />
            <ProductPriceBlock product={product} priceSize="md" />
            <div className="mt-1">
              <FreeShippingLabel express={product.full} />
            </div>
          </>
        ) : (
          <>
            <ProductPriceBlock product={product} />
            <span className="line-clamp-2 mt-1 text-[13px] leading-snug text-[rgba(0,0,0,0.8)]">
              {product.title}
            </span>
            <span className="mt-0.5 text-xs font-bold text-success">{t('shipping.free')}</span>
          </>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  variant = 'home',
  cardMin,
  onOpen,
  className,
}: {
  products: DecoratedProduct[];
  variant?: 'home' | 'search';
  cardMin: string;
  onOpen: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn('grid gap-3.5', className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${cardMin}, 1fr))` }}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} variant={variant} onOpen={() => onOpen(p.id)} />
      ))}
    </div>
  );
}
