import { useNavigate } from 'react-router-dom';
import { screenLabel } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { useCart, useCatalog, useCheckout } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import { CartItemRow } from '@/components/cart/cart-components';
import { CartShippingBanner, CouponFieldSection } from '@/components/checkout/purchase-flow';
import { EmptyState } from '@/components/shared/empty-state';
import { PageTitle, PanelCard, StickyAside, TwoColumnLayout } from '@/components/shared/layout-primitives';
import { SummaryLine, SummaryTotal } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
  computeCouponDiscount,
  computeOrderGrandTotal,
  formatShippingPrice,
} from '@/utils/checkout';
import { brlFull } from '@/utils/format';
import { routes } from '@/lib/routes';

export function CartPage() {
  const { t } = useTranslation('cart');
  const navigate = useNavigate();
  const { cartLines, cartCount, cartTotal, changeQty, removeLine } = useCart();
  const { openProduct } = useCatalog();
  const { appliedCoupon, selectedShipping } = useCheckout();
  const { cartCols } = useLayout();

  const shippingCost = selectedShipping.price;
  const couponDiscount = computeCouponDiscount(cartTotal, appliedCoupon);
  const grandTotal = computeOrderGrandTotal(cartTotal, shippingCost, appliedCoupon);

  return (
    <div data-screen-label={screenLabel('cart')}>
      <PageTitle>{t('page.title')}</PageTitle>
      {cartLines.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={t('empty.title')}
          actionLabel={t('empty.action')}
          onAction={() => navigate(routes.home)}
        />
      ) : (
        <TwoColumnLayout columns={cartCols}>
          <div className="flex flex-col gap-4">
            <PanelCard className="overflow-hidden py-0">
              {cartLines.map((line, idx) => (
                <CartItemRow
                  key={line.id}
                  line={line}
                  showBorder={idx > 0}
                  onOpen={() => openProduct(line.id)}
                  onDec={() => changeQty(line.id, -1)}
                  onInc={() => changeQty(line.id, 1)}
                  onRemove={() => removeLine(line.id)}
                />
              ))}
            </PanelCard>
            <CouponFieldSection />
            <CartShippingBanner />
          </div>
          <StickyAside>
            <PanelCard className="p-5">
              <div className="mb-3.5 text-[17px] font-extrabold">{t('summary.title')}</div>
              <SummaryLine label={t('summary.productsCount', { count: cartCount })} value={`R$ ${brlFull(cartTotal)}`} />
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
              <SummaryTotal label={t('common:total')} value={`R$ ${brlFull(grandTotal)}`} />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('common:installmentOr12x', { price: brlFull(grandTotal / 12) })}
              </p>
              <Button className="mt-4 h-[50px] w-full rounded-lg text-base font-bold" onClick={() => navigate(routes.checkout)}>
                {t('summary.continue')}
              </Button>
            </PanelCard>
          </StickyAside>
        </TwoColumnLayout>
      )}
    </div>
  );
}
