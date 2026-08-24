import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bolt, Truck } from 'lucide-react';
import { tKey } from '@/i18n';
import { Button } from '@/components/ui/button';
import { useCheckout } from '@/context/AppContext';
import type { Coupon, PayMethod, ShippingOption } from '@/types';
import { paymentDisplayName } from '@/types';
import { formatShippingPrice } from '@/utils/checkout';
import { brlFull } from '@/utils/format';
import { PaymentMethodOptions } from '@/components/checkout/payment-option-row';
import { ExpressBadge } from '@/components/product/product-primitives';
import { PanelCard } from '@/components/shared/layout-primitives';
import { FormInput } from '@/components/shared/sub-page-layout';
import { routes } from '@/lib/routes';

export function ShippingSectionCard() {
  const { t } = useTranslation(['checkout', 'common']);
  const navigate = useNavigate();
  const { selectedShipping } = useCheckout();
  const shipping = selectedShipping;

  return (
    <PanelCard className="p-[18px]">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-base font-extrabold">{t('shipping.title', { ns: 'checkout' })}</div>
        <button
          type="button"
          className="cursor-pointer text-[13px] font-bold text-foreground"
          onClick={() => navigate(routes.checkoutShipping)}
        >
          {t('actions.change', { ns: 'common' })}
        </button>
      </div>
      <div className="flex items-center gap-3">
        {shipping.isExpress && <ExpressBadge className="px-2 py-0.5" />}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{shipping.name}</div>
          <div className="text-[13px] text-muted-foreground">{shipping.deliveryEstimate}</div>
        </div>
        <span className={`text-sm font-bold ${shipping.price <= 0 ? 'text-success' : ''}`}>
          {formatShippingPrice(shipping.price)}
        </span>
      </div>
    </PanelCard>
  );
}

export function CouponFieldSection({ couponsLink = routes.coupons }: { couponsLink?: string }) {
  const { t } = useTranslation(['checkout', 'common']);
  const navigate = useNavigate();
  const { appliedCoupon, applyCoupon, removeCoupon } = useCheckout();
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    const err = applyCoupon(codeInput.trim());
    if (err) {
      setError(err);
    } else {
      setCodeInput('');
      setError(null);
    }
  };

  return (
    <PanelCard className="p-[18px]">
      <div className="mb-3 text-base font-extrabold">{t('coupon.title', { ns: 'checkout' })}</div>
      {appliedCoupon ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold">{appliedCoupon.code}</div>
            <div className="text-[13px] text-muted-foreground">{appliedCoupon.description}</div>
          </div>
          <button type="button" className="cursor-pointer text-[13px] font-bold text-destructive" onClick={removeCoupon}>
            {t('actions.remove', { ns: 'common' })}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <FormInput
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                setError(null);
              }}
              placeholder={t('coupon.codePlaceholder', { ns: 'checkout' })}
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 self-center rounded-lg font-bold"
              onClick={handleApply}
            >
              {t('actions.apply', { ns: 'common' })}
            </Button>
          </div>
          {error && <p className="mt-1.5 text-xs text-destructive">{tKey(error)}</p>}
        </>
      )}
      <button
        type="button"
        className="mt-3 cursor-pointer text-[13px] font-bold text-success"
        onClick={() => navigate(couponsLink)}
      >
        {t('coupon.viewAvailable', { ns: 'checkout' })}
      </button>
    </PanelCard>
  );
}

export function CartShippingBanner() {
  const { t } = useTranslation('cart');
  const { selectedAddress, selectedShipping } = useCheckout();
  const label = selectedAddress
    ? `${selectedAddress.city}, ${selectedAddress.state}`
    : t('shippingBannerFallbackAddress');

  return (
    <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3">
      <Truck className="size-5 shrink-0 text-success" />
      <span className="flex-1 text-sm">
        {t('shippingBanner', { address: label, shipping: selectedShipping.name })}
      </span>
      <span className="text-sm font-bold text-success">{formatShippingPrice(selectedShipping.price)}</span>
    </div>
  );
}

export function CheckoutPaymentDetails({ pay, onChange }: { pay: PayMethod; onChange: (p: PayMethod) => void }) {
  const { t } = useTranslation(['catalog', 'checkout', 'common']);
  const navigate = useNavigate();
  const { paymentMethods, selectedPayment, selectPayment, boletoCpf, setBoletoCpf } = useCheckout();
  const cpfDigits = boletoCpf.replace(/\D/g, '');

  return (
    <PanelCard className="p-[18px]">
      <div className="mb-3.5 text-base font-extrabold">{t('checkout.paymentMethod', { ns: 'catalog' })}</div>
      <PaymentMethodOptions pay={pay} onChange={onChange} />

      {pay === 'card' && (
        <div className="mt-3 flex flex-col gap-2 border-t border-black/6 pt-3">
          {paymentMethods.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">{t('card.noneSaved', { ns: 'checkout' })}</p>
          ) : (
            paymentMethods.map((pm) => (
              <button
                key={pm.id}
                type="button"
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left ${
                  selectedPayment?.id === pm.id ? 'border-success bg-success/5' : 'border-black/10'
                }`}
                onClick={() => selectPayment(pm.id)}
              >
                <input type="radio" checked={selectedPayment?.id === pm.id} readOnly className="size-4" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{paymentDisplayName(pm)}</div>
                  <div className="text-xs text-muted-foreground">
                    {pm.holderName} · {t('payment.expiryShort', { ns: 'common', expiry: pm.expiry })}
                  </div>
                </div>
              </button>
            ))
          )}
          <button
            type="button"
            className="cursor-pointer text-left text-[13px] font-bold text-success"
            onClick={() => navigate(`${routes.newCard}?retorno=checkout`)}
          >
            {t('card.add', { ns: 'checkout' })}
          </button>
        </div>
      )}

      {pay === 'boleto' && (
        <div className="mt-3 flex flex-col gap-2 border-t border-black/6 pt-3">
          <FormInput
            value={boletoCpf}
            onChange={(e) => setBoletoCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder={t('boleto.cpfPlaceholder', { ns: 'checkout' })}
            inputMode="numeric"
          />
          {cpfDigits.length === 11 ? (
            <div className="rounded-lg bg-black/4 p-3">
              <div className="text-sm font-semibold">{t('boleto.previewTitle', { ns: 'checkout' })}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                ||||| 34191.79001 01043.510047 91020.150008 8 00000000000000
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{t('boleto.dueHint', { ns: 'checkout' })}</div>
            </div>
          ) : cpfDigits.length > 0 ? (
            <p className="text-xs text-destructive">{t('boleto.invalidCpf', { ns: 'checkout' })}</p>
          ) : null}
        </div>
      )}
    </PanelCard>
  );
}

function useCouponDiscountLabel(coupon: Coupon): string {
  const { t } = useTranslation('common');
  return coupon.type === 'PERCENT'
    ? t('coupon.percentDiscount', { value: coupon.value })
    : t('coupon.fixedDiscount', { value: brlFull(coupon.value) });
}

export function CouponCard({
  coupon,
  isApplied,
  onApply,
}: {
  coupon: Coupon;
  isApplied: boolean;
  onApply: () => void;
}) {
  const { t } = useTranslation(['checkout', 'common']);
  const discountLabel = useCouponDiscountLabel(coupon);

  return (
    <button
      type="button"
      className={`w-full cursor-pointer rounded-xl border p-4 text-left ${
        isApplied ? 'border-success bg-success/5' : 'border-black/10 bg-white'
      }`}
      onClick={onApply}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold">{coupon.code}</span>
        <span className="text-xs font-bold text-success">
          {isApplied ? t('coupon.applied', { ns: 'checkout' }) : t('actions.apply', { ns: 'common' })}
        </span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{coupon.description}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {discountLabel} · {t('coupon.validUntil', { ns: 'common', date: coupon.expiry })}
      </div>
    </button>
  );
}

export function ShippingOptionRow({
  option,
  selected,
  onSelect,
}: {
  option: ShippingOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation(['search', 'catalog']);

  return (
    <PanelCard
      className={`cursor-pointer p-4 ${selected ? 'ring-2 ring-success' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <input type="radio" checked={selected} readOnly className="size-4" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{option.name}</span>
            {option.isExpress && (
              <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                <Bolt className="size-3" />
                {t('filters.express', { ns: 'search' })}
              </span>
            )}
          </div>
          <div className="text-[13px] text-muted-foreground">{option.deliveryEstimate}</div>
        </div>
        <span className={`text-sm font-bold ${option.price <= 0 ? 'text-success' : ''}`}>
          {formatShippingPrice(option.price)}
        </span>
      </div>
    </PanelCard>
  );
}
