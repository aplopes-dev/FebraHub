import { useTranslation } from 'react-i18next';
import { screenLabel } from '@/i18n';
import { useCart, useCheckout } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import {
  canConfirmCheckout,
  computeCouponDiscount,
  computeOrderGrandTotal,
  computePixDiscount,
} from '@/utils/checkout';
import { brlFull } from '@/utils/format';
import {
  CheckoutPaymentDetails,
  CouponFieldSection,
  ShippingSectionCard,
} from '@/components/checkout/purchase-flow';
import { DeliveryAddressCard } from '@/components/product/product-detail';
import { SummaryLine, SummaryTotal } from '@/components/shared/empty-state';
import { PageTitle, PanelCard, StickyAside, TwoColumnLayout } from '@/components/shared/layout-primitives';
import { Button } from '@/components/ui/button';
import { formatShippingPrice } from '@/utils/checkout';

export function CheckoutPage() {
  const { t } = useTranslation('checkout');
  const { cartTotal, cartCount } = useCart();
  const { pay, setPay, placeOrder, appliedCoupon, selectedShipping, selectedPayment, boletoCpf } = useCheckout();
  const { cartCols } = useLayout();

  const shippingCost = selectedShipping.price;
  const couponDiscount = computeCouponDiscount(cartTotal, appliedCoupon);
  const grandTotal = computeOrderGrandTotal(cartTotal, shippingCost, appliedCoupon);
  const pixDiscount = computePixDiscount(grandTotal, pay);
  const coTotal = grandTotal - pixDiscount;
  const canConfirm = canConfirmCheckout(pay, selectedPayment, boletoCpf);

  return (
    <div data-screen-label={screenLabel('checkout')}>
      <PageTitle>{t('page.title')}</PageTitle>
      <TwoColumnLayout columns={cartCols}>
        <div className="flex flex-col gap-4">
          <DeliveryAddressCard />
          <ShippingSectionCard />
          <CouponFieldSection />
          <CheckoutPaymentDetails pay={pay} onChange={setPay} />
        </div>
        <StickyAside>
          <PanelCard className="p-5">
            <div className="mb-3.5 text-[17px] font-extrabold">{t('summary.title')}</div>
            <SummaryLine label={t('summary.subtotalItems', { count: cartCount })} value={`R$ ${brlFull(cartTotal)}`} />
            <SummaryLine
              label={t('summary.shippingNamed', { name: selectedShipping.name })}
              value={formatShippingPrice(shippingCost)}
              valueClassName={shippingCost <= 0 ? 'font-semibold text-success' : undefined}
            />
            {couponDiscount > 0 && (
              <SummaryLine
                label={t('summary.couponNamed', { code: appliedCoupon?.code ?? '' })}
                value={`- R$ ${brlFull(couponDiscount)}`}
                valueClassName="font-semibold text-success"
              />
            )}
            {pay === 'pix' && pixDiscount > 0 && (
              <SummaryLine
                label={t('summary.pixDiscount')}
                value={`- R$ ${brlFull(pixDiscount)}`}
                valueClassName="font-semibold text-success"
              />
            )}
            <SummaryTotal label={t('common:total')} value={`R$ ${brlFull(coTotal)}`} />
            <Button
              className="mt-4 h-[50px] w-full rounded-lg text-base font-bold"
              disabled={!canConfirm}
              onClick={placeOrder}
            >
              {canConfirm ? t('summary.payAmount', { price: brlFull(coTotal) }) : t('summary.completePayment')}
            </Button>
          </PanelCard>
        </StickyAside>
      </TwoColumnLayout>
    </div>
  );
}
