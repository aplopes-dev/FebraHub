import { useTranslation } from 'react-i18next';
import type { CartLine } from '@/types';
import { Button } from '@/components/ui/button';
import { FreeShippingLabel, ProductImage } from '@/components/product/product-primitives';
import { PanelCard, StickyAside } from '@/components/shared/layout-primitives';
import { SummaryLine, SummaryTotal } from '@/components/shared/empty-state';

export function QuantityControl({
  qty,
  onDec,
  onInc,
}: {
  qty: number;
  onDec: () => void;
  onInc: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <div className="flex items-center rounded-lg border border-black/20">
      <Button type="button" variant="ghost" size="icon" className="size-[34px] text-lg" aria-label={t('a11y.decrease')} onClick={onDec}>
        −
      </Button>
      <span className="w-[34px] text-center text-[15px]">{qty}</span>
      <Button type="button" variant="ghost" size="icon" className="size-[34px] text-lg" aria-label={t('a11y.increase')} onClick={onInc}>
        +
      </Button>
    </div>
  );
}

export function CartItemRow({
  line,
  onOpen,
  onDec,
  onInc,
  onRemove,
  showBorder,
}: {
  line: CartLine;
  onOpen: () => void;
  onDec: () => void;
  onInc: () => void;
  onRemove: () => void;
  showBorder?: boolean;
}) {
  const { t } = useTranslation('common');

  return (
    <div
      className="flex gap-4 p-[18px]"
      style={{ borderTop: showBorder ? '1px solid rgba(0,0,0,0.07)' : undefined }}
    >
      <button type="button" className="shrink-0 cursor-pointer" onClick={onOpen}>
        <ProductImage product={line} className="size-24 rounded-lg p-2" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm leading-snug text-[rgba(0,0,0,0.85)]">{line.title}</div>
        <div className="mt-1.5">
          <FreeShippingLabel express={line.full} />
        </div>
        <div className="mt-3 flex items-center gap-3.5">
          <QuantityControl qty={line.qty} onDec={onDec} onInc={onInc} />
          <button type="button" className="cursor-pointer text-[13px] text-foreground underline" onClick={onRemove}>
            {t('actions.delete')}
          </button>
        </div>
      </div>
      <span className="whitespace-nowrap text-[17px] font-bold text-[rgba(0,0,0,0.9)]">{line.lineTotalFmt}</span>
    </div>
  );
}

export function CartSummaryPanel({
  cartCount,
  subtotalFmt,
  onCheckout,
}: {
  cartCount: number;
  subtotalFmt: string;
  onCheckout: () => void;
}) {
  const { t } = useTranslation(['cart', 'common']);

  return (
    <StickyAside>
      <PanelCard className="p-5">
        <div className="mb-3.5 text-[17px] font-extrabold">{t('summary.title', { ns: 'cart' })}</div>
        <SummaryLine label={t('summary.productsCount', { ns: 'cart', count: cartCount })} value={subtotalFmt} />
        <SummaryLine label={t('summary.shipping', { ns: 'cart' })} value={t('pricing.free', { ns: 'common' })} valueClassName="font-semibold text-success" />
        <SummaryTotal label={t('summary.total', { ns: 'common' })} value={subtotalFmt} />
        <Button className="mt-4 h-[50px] w-full rounded-lg text-base font-bold" onClick={onCheckout}>
          {t('checkout.cta', { ns: 'cart' })}
        </Button>
      </PanelCard>
    </StickyAside>
  );
}
