import { useTranslation } from 'react-i18next';
import type { DecoratedProduct } from '@/types';
import { installmentLabel } from '@/utils/product-pricing';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ProductImage({
  product,
  className,
  innerClassName,
}: {
  product: Pick<DecoratedProduct, 'img' | 'bg'>;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center bg-muted', className)}>
      <div
        className={cn('size-full bg-contain bg-center bg-no-repeat', innerClassName)}
        style={{ backgroundImage: `url('${product.img}')` }}
      />
    </div>
  );
}

export function ExpressBadge({ className }: { className?: string }) {
  const { t } = useTranslation('catalog');

  return (
    <Badge
      variant="secondary"
      className={cn(
        'rounded px-1.5 py-0 text-[11px] font-extrabold text-foreground bg-black/[0.07] hover:bg-black/[0.07]',
        className,
      )}
    >
      {t('shipping.expressBadge')}
    </Badge>
  );
}

export function RatingDisplay({
  ratingFmt,
  starsFull,
  starsEmpty,
  reviewsFmt,
  size = 'sm',
}: Pick<DecoratedProduct, 'ratingFmt' | 'starsFull' | 'starsEmpty' | 'reviewsFmt'> & {
  size?: 'sm' | 'md';
}) {
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  return (
    <div className={cn('flex items-center gap-1.5', textSize)}>
      <span className="font-semibold text-foreground">{ratingFmt}</span>
      <span className="tracking-wide text-foreground">
        {starsFull}
        <span className="text-black/20">{starsEmpty}</span>
      </span>
      <span className="text-[11px] text-muted-foreground">{reviewsFmt}</span>
    </div>
  );
}

export function ProductPriceBlock({
  product,
  priceSize = 'lg',
  showOriginal = true,
  dynamicInstallments = true,
}: {
  product: DecoratedProduct;
  priceSize?: 'md' | 'lg' | 'xl';
  showOriginal?: boolean;
  dynamicInstallments?: boolean;
}) {
  const priceClass =
    priceSize === 'xl'
      ? 'text-[clamp(32px,5vw,40px)] font-medium leading-none'
      : priceSize === 'lg'
        ? 'text-[22px] font-semibold'
        : 'text-[21px] font-semibold';

  const installmentsText = dynamicInstallments
    ? installmentLabel(product.amount)
    : product.installments;

  return (
    <div className="flex flex-col gap-0.5">
      {showOriginal && (
        <span className="text-xs text-muted-foreground line-through">{product.originalFmt}</span>
      )}
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className={cn('whitespace-nowrap text-[rgba(0,0,0,0.9)]', priceClass)}>
          R$ {product.priceInt}
        </span>
        <span className="text-sm font-bold text-success">{product.discountFmt}</span>
      </div>
      <span className="text-xs font-bold text-success">{installmentsText}</span>
    </div>
  );
}

export function FreeShippingLabel({ express }: { express?: boolean }) {
  const { t } = useTranslation('catalog');

  return (
    <div className="flex gap-1.5">
      <span className="text-[11px] font-bold text-success">{t('shipping.free')}</span>
      {express && <ExpressBadge />}
    </div>
  );
}
