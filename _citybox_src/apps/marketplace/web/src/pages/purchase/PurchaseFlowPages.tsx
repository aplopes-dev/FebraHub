import { useState } from 'react';
import { screenLabel } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCheckout } from '@/context/AppContext';
import { CouponCard, ShippingOptionRow } from '@/components/checkout/purchase-flow';
import { Button } from '@/components/ui/button';
import { PanelCard } from '@/components/shared/layout-primitives';
import { FormInput, SubPageLayout } from '@/components/shared/sub-page-layout';
import { routes } from '@/lib/routes';

export function ShippingOptionsPage() {
  const { t } = useTranslation('checkout');
  const navigate = useNavigate();
  const { shippingOptions, selectedShipping, setSelectedShipping } = useCheckout();

  return (
    <div data-screen-label={screenLabel('shippingOptions')}>
      <SubPageLayout title={t('shipping.title')} backTo={routes.checkout}>
        <div className="flex flex-col gap-3">
          {shippingOptions.map((opt) => (
            <ShippingOptionRow
              key={opt.id}
              option={opt}
              selected={selectedShipping.id === opt.id}
              onSelect={() => {
                setSelectedShipping(opt);
                navigate(routes.checkout);
              }}
            />
          ))}
        </div>
      </SubPageLayout>
    </div>
  );
}

export function CouponsPage() {
  const { t } = useTranslation('coupons');
  const navigate = useNavigate();
  const { coupons, appliedCoupon, applyCoupon, removeCoupon } = useCheckout();
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    const err = applyCoupon(codeInput.trim());
    if (err) setError(err);
    else {
      setCodeInput('');
      setError(null);
    }
  };

  return (
    <div data-screen-label={screenLabel('coupons')}>
      <SubPageLayout title={t('page.title')} backTo={routes.account}>
        <div className="flex flex-col gap-4">
          <PanelCard className="grid gap-3 p-5">
            <FormInput
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                setError(null);
              }}
              placeholder={t('input.placeholder')}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button className="h-11 rounded-lg font-bold" disabled={!codeInput.trim()} onClick={handleApply}>
              {t('input.apply')}
            </Button>
            {appliedCoupon && (
              <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2">
                <span className="text-sm font-semibold text-success">{t('applied.label', { code: appliedCoupon.code })}</span>
                <button type="button" className="cursor-pointer text-xs font-bold text-destructive" onClick={removeCoupon}>
                  {t('applied.remove')}
                </button>
              </div>
            )}
          </PanelCard>

          <h2 className="m-0 text-lg font-extrabold">{t('available.title')}</h2>
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.code}
              coupon={coupon}
              isApplied={appliedCoupon?.code === coupon.code}
              onApply={() => {
                applyCoupon(coupon.code);
                setError(null);
              }}
            />
          ))}

          <Button variant="outline" className="h-11 rounded-lg font-bold" onClick={() => navigate(routes.cart)}>
            {t('goToCart')}
          </Button>
        </div>
      </SubPageLayout>
    </div>
  );
}
