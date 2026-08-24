import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MapPin, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useCheckout } from '@/context/AppContext';
import { routes } from '@/lib/routes';
import type { PayMethod } from '@/types';
import { formatAddressLine1, formatAddressLine2 } from '@/types';
import { PaymentMethodOptions } from '@/components/checkout/payment-option-row';
import { ExpressBadge } from '@/components/product/product-primitives';
import { PanelCard, StickyAside } from '@/components/shared/layout-primitives';
import { SummaryLine, SummaryTotal } from '@/components/shared/empty-state';

export function DeliveryAddressCard() {
  const { t } = useTranslation(['catalog', 'common']);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedAddress } = useCheckout();
  const addr = selectedAddress;

  return (
    <PanelCard className="flex items-start gap-3 p-[18px]">
      <MapPin className="mt-0.5 size-[22px] shrink-0 stroke-[2]" />
      <div className="flex-1">
        <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
          {t('checkout.deliveryAddress', { ns: 'catalog' })}
        </div>
        <div className="mt-0.5 text-sm font-bold">{user.name}</div>
        {addr ? (
          <>
            <div className="text-[13px] text-muted-foreground">{formatAddressLine1(addr)}</div>
            <div className="text-[13px] text-muted-foreground">{formatAddressLine2(addr)}</div>
          </>
        ) : (
          <div className="text-[13px] text-muted-foreground">{t('checkout.noAddress', { ns: 'catalog' })}</div>
        )}
      </div>
      <button
        type="button"
        className="cursor-pointer text-[13px] font-bold text-foreground"
        onClick={() => navigate(routes.checkoutAddress)}
      >
        {t('actions.change', { ns: 'common' })}
      </button>
    </PanelCard>
  );
}

export function PaymentMethodList({ pay, onChange }: { pay: PayMethod; onChange: (p: PayMethod) => void }) {
  const { t } = useTranslation('catalog');

  return (
    <PanelCard className="p-[18px]">
      <div className="mb-3.5 text-base font-extrabold">{t('checkout.paymentMethod')}</div>
      <PaymentMethodOptions pay={pay} onChange={onChange} />
    </PanelCard>
  );
}

export function CheckoutSummaryPanel({
  coProdFmt,
  coPixFmt,
  coTotalFmt,
  showPixDiscount,
  onPay,
}: {
  coProdFmt: string;
  coPixFmt: string;
  coTotalFmt: string;
  showPixDiscount: boolean;
  onPay: () => void;
}) {
  const { t } = useTranslation(['catalog', 'common', 'cart']);

  return (
    <StickyAside>
      <PanelCard className="p-5">
        <div className="mb-3.5 text-[17px] font-extrabold">{t('checkout.summary', { ns: 'catalog' })}</div>
        <SummaryLine label={t('summary.products', { ns: 'common' })} value={coProdFmt} />
        <SummaryLine label={t('summary.shipping', { ns: 'cart' })} value={t('pricing.free', { ns: 'common' })} valueClassName="font-semibold text-success" />
        {showPixDiscount && (
          <SummaryLine label={t('checkout.pixDiscount', { ns: 'catalog' })} value={coPixFmt} valueClassName="font-semibold text-success" />
        )}
        <SummaryTotal label={t('summary.total', { ns: 'common' })} value={coTotalFmt} />
        <Button className="mt-4 h-[50px] w-full rounded-lg text-base font-bold" onClick={onPay}>
          {t('checkout.payButton', { ns: 'catalog', total: coTotalFmt })}
        </Button>
      </PanelCard>
    </StickyAside>
  );
}

export function ProductBuyPanel({
  onBuy,
  onAdd,
  deliveryLabel,
  isExpressProduct = true,
}: {
  onBuy: () => void;
  onAdd: () => void;
  deliveryLabel: string;
  isExpressProduct?: boolean;
}) {
  const { t } = useTranslation('catalog');

  return (
    <>
      <div className="text-[17px] font-extrabold text-success">{t('shipping.free')}</div>
      <div className="text-[13px] text-muted-foreground">
        {deliveryLabel}
        {isExpressProduct && <> {t('pdp.expressBy')}</>}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <ExpressBadge className="px-[7px] py-0.5" />
        {t('pdp.inStock')}
      </div>
      <div className="text-[13px] text-muted-foreground">{t('pdp.soldBy')}</div>
      <Button className="mt-2.5 h-12 w-full rounded-lg text-[15px] font-bold" onClick={onBuy}>
        {t('pdp.buyNow')}
      </Button>
      <Button variant="outline" className="h-12 w-full rounded-lg text-[15px] font-bold" onClick={onAdd}>
        {t('pdp.addToCart')}
      </Button>
      <div className="mt-2.5 flex flex-col gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <RotateCcw className="size-4" />
          {t('pdp.freeReturn')}
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck className="size-4" />
          {t('pdp.guaranteedPurchase')}
        </span>
      </div>
    </>
  );
}

export function MobileProductBar({
  onBuy,
  onAdd,
}: {
  onBuy: () => void;
  onAdd: () => void;
}) {
  const { t } = useTranslation(['catalog', 'common']);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex gap-2.5 border-t border-black/10 bg-white p-2.5 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <Button variant="outline" className="h-[46px] flex-1 rounded-lg text-sm font-bold" onClick={onAdd}>
        {t('actions.add', { ns: 'common' })}
      </Button>
      <Button className="h-[46px] flex-[1.3] rounded-lg text-sm font-bold" onClick={onBuy}>
        {t('pdp.buyNow', { ns: 'catalog' })}
      </Button>
    </div>
  );
}

export function ProductGallery({ image }: { image: string }) {
  const thumbs = [0, 1, 2, 3];

  return (
    <div className="flex min-w-0 gap-3.5">
      <div className="flex flex-col gap-2">
        {thumbs.map((i) => (
          <div
            key={i}
            className="size-[52px] overflow-hidden rounded-md border-2 p-1"
            style={{ borderColor: i === 0 ? '#111111' : 'rgba(0,0,0,0.12)' }}
          >
            <div
              className="size-full bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url('${image}')` }}
            />
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center rounded-[10px] bg-muted p-6" style={{ aspectRatio: 1 }}>
        <div
          className="size-full bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${image}')` }}
        />
      </div>
    </div>
  );
}
