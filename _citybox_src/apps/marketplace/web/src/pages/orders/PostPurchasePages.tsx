import { useMemo, useRef, useState } from 'react';
import { screenLabel } from '@/i18n';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Map } from 'lucide-react';
import { cityboxApi } from '@/api/citybox-api';
import { mapReview } from '@/api/mappers';
import { useAuth, useCart, useCatalog, useCheckout, useOrders } from '@/context/AppContext';
import {
  DetailedTrackingStep,
  OrderDetailHeader,
  SummaryLine,
  TrackingTimeline,
} from '@/components/orders/order-components';
import { Button } from '@/components/ui/button';
import { PanelCard, StickyAside, TwoColumnLayout } from '@/components/shared/layout-primitives';
import { FormActions, FormField, SubPageLayout } from '@/components/shared/sub-page-layout';
import { StarRating } from '@/components/shared/star-rating';
import { useToast } from '@/components/shared/toast';
import { routes } from '@/lib/routes';
import { useLayout } from '@/hooks/useLayout';
import { formatAddressLine1, formatAddressLine2, paymentDisplayName, type Order } from '@/types';
import { formatShippingPrice } from '@/utils/checkout';
import { brlFull } from '@/utils/format';
import { cn } from '@/lib/utils';

function useOrder(orderId: string | undefined): Order | undefined {
  const { orders } = useOrders();
  return useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);
}

export function OrderDetailPage() {
  const { t } = useTranslation('orders');
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const order = useOrder(orderId);
  const { getProduct } = useCatalog();
  const { addresses, paymentMethods } = useCheckout();
  const { buyAgainOrder } = useCart();
  const { isLoggedIn } = useAuth();
  const { detailCols, isMobile } = useLayout();
  const { show } = useToast();
  const [buyAgainLoading, setBuyAgainLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  if (!order) {
    return (
      <div data-screen-label={screenLabel('orderDetail')}>
        <SubPageLayout title={t('detail.title')} backTo={routes.orders}>
          <PanelCard className="p-8 text-center text-muted-foreground">{t('detail.notFound')}</PanelCard>
        </SubPageLayout>
      </div>
    );
  }

  const address = addresses.find((a) => a.id === order.addressId);
  const payment = paymentMethods.find((p) => p.id === order.paymentMethodId);
  const firstProductId = order.productIds[0]?.id;

  const handleBuyAgain = async () => {
    setBuyAgainLoading(true);
    try {
      await buyAgainOrder(order.id);
      navigate(routes.cart);
    } catch {
      show(t('detail.buyAgainFailed'), 'error');
    } finally {
      setBuyAgainLoading(false);
    }
  };

  const handleInvoice = async () => {
    setInvoiceLoading(true);
    try {
      if (isLoggedIn) {
        const invoice = await cityboxApi.getInvoice(order.id);
        show(
          t('detail.invoiceSuccess', { nfKey: invoice.nfKey ?? '—', invoiceUrl: invoice.invoiceUrl }),
          'success',
        );
      } else {
        show(t('detail.invoiceMock'), 'info');
      }
    } catch {
      show(t('detail.invoiceFailed'), 'error');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const mainContent = (
    <>
      <PanelCard className="p-4">
        <OrderDetailHeader
          orderId={order.id}
          status={order.status}
          deliveryDate={order.deliveryDate}
          trackingCode={order.trackingCode}
        />
      </PanelCard>

      <PanelCard className="p-4">
        <h3 className="mb-3 text-base font-extrabold">{t('detail.trackingSection')}</h3>
        <TrackingTimeline currentStatus={order.status} />
      </PanelCard>

      <PanelCard className="p-4">
        <h3 className="mb-3 text-base font-extrabold">{t('detail.itemsSection', { count: order.productIds.length })}</h3>
        <div className="flex flex-col gap-3">
          {order.productIds.map((line, index) => {
            const product = getProduct(line.id);
            return (
              <div key={`${line.id}-${index}`}>
                {index > 0 && <hr className="mb-3 border-black/5" />}
                <div className="flex gap-3">
                  <img
                    src={product.img}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium">{product.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('detail.quantityPrice', { qty: line.qty, price: brlFull(product.amount) })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PanelCard>
    </>
  );

  const sideContent = (
    <>
      {address && (
        <PanelCard className="p-4">
          <h3 className="mb-2 text-base font-extrabold">{t('detail.deliveryAddress')}</h3>
          <div className="text-sm font-semibold">{address.label}</div>
          <div className="text-sm">{formatAddressLine1(address)}</div>
          <div className="text-xs text-muted-foreground">{formatAddressLine2(address)}</div>
        </PanelCard>
      )}

      <PanelCard className="p-4">
        <h3 className="mb-2 text-base font-extrabold">{t('detail.paymentMethod')}</h3>
        <div className="text-sm">
          {payment ? paymentDisplayName(payment) : t('checkout:payment.pixFallback')}
        </div>
        {payment && payment.expiry !== '-' && (
          <div className="text-xs text-muted-foreground">{t('account:cards.expiryLabel', { expiry: payment.expiry })}</div>
        )}
        {payment?.label.startsWith('Boleto') && (
          <div className="text-xs text-muted-foreground">{payment.label}</div>
        )}
      </PanelCard>

      <PanelCard className="p-4">
        <h3 className="mb-2 text-base font-extrabold">{t('detail.summary')}</h3>
        <SummaryLine label={t('common:subtotal')} value={`R$ ${brlFull(order.subtotal)}`} />
        <SummaryLine label={t('common:shipping')} value={formatShippingPrice(order.shipping)} />
        {order.discount > 0 && (
          <SummaryLine label={t('common:discount')} value={`-R$ ${brlFull(order.discount)}`} highlight />
        )}
        <hr className="my-2 border-black/5" />
        <SummaryLine label={t('common:total')} value={`R$ ${brlFull(order.total)}`} bold />
      </PanelCard>

      <PanelCard className="flex flex-col gap-2 p-4">
        <Button
          className="h-12 w-full rounded-lg text-base font-bold"
          onClick={() => navigate(routes.orderTracking(order.id))}
        >
          {t('detail.trackOrder')}
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full rounded-lg text-base font-bold"
          disabled={buyAgainLoading}
          onClick={() => void handleBuyAgain()}
        >
          {buyAgainLoading ? t('detail.buyAgainLoading') : t('detail.buyAgain')}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-xl bg-black/[0.04] py-3 text-sm font-semibold transition-colors hover:bg-black/[0.08] disabled:opacity-50 disabled:hover:bg-black/[0.04]"
            disabled={invoiceLoading}
            onClick={() => void handleInvoice()}
          >
            {invoiceLoading ? t('detail.invoiceLoading') : t('detail.invoice')}
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-xl bg-black/[0.04] py-3 text-sm font-semibold transition-colors hover:bg-black/[0.08] disabled:opacity-50 disabled:hover:bg-black/[0.04]"
            disabled={!firstProductId}
            onClick={() =>
              firstProductId &&
              navigate(routes.writeReview(firstProductId), {
                state: { returnTo: routes.order(order.id) },
              })
            }
          >
            {t('detail.review')}
          </button>
        </div>
        <Button
          variant="outline"
          className={cn(
            'h-12 w-full rounded-lg text-base font-bold',
            order.status !== 'DELIVERED' &&
              'border-red-600/35 text-red-600 hover:bg-red-50 hover:text-red-700',
          )}
          onClick={() => navigate(routes.orderReturn(order.id))}
        >
          {order.status === 'DELIVERED' ? t('detail.returnDelivered') : t('detail.cancelOrder')}
        </Button>
      </PanelCard>
    </>
  );

  return (
    <div data-screen-label={screenLabel('orderDetail')}>
      <SubPageLayout title={t('detail.title')} backTo={routes.orders} width="wide">
        {isMobile ? (
          <div className="flex flex-col gap-4">
            {mainContent}
            {sideContent}
          </div>
        ) : (
          <TwoColumnLayout columns={detailCols}>
            <div className="flex flex-col gap-4">{mainContent}</div>
            <StickyAside className="flex flex-col gap-4">{sideContent}</StickyAside>
          </TwoColumnLayout>
        )}
      </SubPageLayout>
    </div>
  );
}

export function TrackingPage() {
  const { t } = useTranslation('orders');
  const { orderId } = useParams<{ orderId: string }>();
  const order = useOrder(orderId);
  const { detailCols, isMobile } = useLayout();

  if (!order) {
    return (
      <div data-screen-label={screenLabel('tracking')}>
        <SubPageLayout title={t('tracking.title')} backTo={routes.orders}>
          <PanelCard className="p-8 text-center text-muted-foreground">{t('detail.notFound')}</PanelCard>
        </SubPageLayout>
      </div>
    );
  }

  const history =
    order.statusHistory.length > 0
      ? order.statusHistory
      : [{ status: order.status, date: order.deliveryDate, location: '' }];

  return (
    <div data-screen-label={screenLabel('tracking')}>
      <SubPageLayout title={t('tracking.title')} backTo={routes.order(order.id)} width="wide">
        <PanelCard className="mb-4 p-4">
          <div className="text-lg font-extrabold">
            {order.trackingCode || t('tracking.awaitingCode')}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{t('tracking.carrier')}</div>
          <div className="text-xs text-muted-foreground">{t('tracking.orderNumber', { orderId: order.id })}</div>
        </PanelCard>

        {isMobile ? (
          <div className="flex flex-col gap-4">
            <div className="flex h-40 items-center justify-center rounded-xl bg-black/[0.04]">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Map className="size-12 opacity-40" />
                <span className="text-xs">{t('tracking.mapMockMobile')}</span>
              </div>
            </div>
            <PanelCard className="p-4">
              <h3 className="mb-3 text-base font-extrabold">{t('tracking.history')}</h3>
              {history.map((entry, index) => (
                <DetailedTrackingStep
                  key={`${entry.status}-${entry.date}-${index}`}
                  entry={entry}
                  isLast={index === history.length - 1}
                  isActive={index === history.length - 1}
                />
              ))}
            </PanelCard>
          </div>
        ) : (
          <TwoColumnLayout columns={detailCols}>
            <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-black/[0.04] md:min-h-[360px]">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Map className="size-16 opacity-40" />
                <span className="text-sm">{t('tracking.mapMockDesktop')}</span>
              </div>
            </div>
            <PanelCard className="p-4">
              <h3 className="mb-3 text-base font-extrabold">{t('tracking.history')}</h3>
              {history.map((entry, index) => (
                <DetailedTrackingStep
                  key={`${entry.status}-${entry.date}-${index}`}
                  entry={entry}
                  isLast={index === history.length - 1}
                  isActive={index === history.length - 1}
                />
              ))}
            </PanelCard>
          </TwoColumnLayout>
        )}
      </SubPageLayout>
    </div>
  );
}

export function WriteReviewPage() {
  const { t } = useTranslation('orders');
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams<{ productId: string }>();
  const { getProduct, addReview } = useCatalog();
  const { user, isLoggedIn } = useAuth();
  const { show } = useToast();
  const product = productId ? getProduct(productId) : null;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ??
    (productId ? routes.product(productId) : routes.orders);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div data-screen-label={screenLabel('reviewProduct')}>
      <SubPageLayout title={t('review.title')} backTo={returnTo} width="narrow">
        <div className="flex flex-col gap-4">
          {product && <h2 className="m-0 text-lg font-extrabold">{product.title}</h2>}

          <PanelCard className="flex flex-col items-center gap-2 p-6">
            <span className="text-sm text-muted-foreground">{t('review.yourRating')}</span>
            <StarRating value={rating} interactive size={28} onChange={setRating} />
          </PanelCard>

          <FormField label={t('review.experienceLabel')}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('review.experiencePlaceholder')}
              className="min-h-[140px] w-full resize-y rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </FormField>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
          />
          <button
            type="button"
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 p-4 text-left',
              photoFiles.length > 0 && 'bg-black/[0.04]',
            )}
            onClick={() => photoInputRef.current?.click()}
          >
            <ImagePlus
              className={cn(
                'size-5',
                photoFiles.length > 0 ? 'text-success' : 'text-muted-foreground',
              )}
            />
            <span className={cn('text-sm font-medium', photoFiles.length > 0 && 'text-success')}>
              {photoFiles.length > 0
                ? t('review.photosAttached', { count: photoFiles.length })
                : t('review.attachPhotos')}
            </span>
          </button>

          <FormActions>
            <Button
              className="h-12 w-full rounded-lg text-base font-bold"
              disabled={rating === 0 || !productId || submitting}
              onClick={() => {
                if (!productId || rating === 0 || submitting) return;
                const reviewText = text.trim() || t('review.defaultText');

                const submit = async () => {
                  setSubmitting(true);
                  try {
                    if (isLoggedIn) {
                      const created = await cityboxApi.createReview(productId, {
                        rating,
                        text: reviewText,
                      });
                      for (const file of photoFiles) {
                        await cityboxApi.addReviewPhoto(productId, created.id, file);
                      }
                      const refreshed = await cityboxApi.getReviews(productId);
                      const latest = refreshed.reviews.find((r) => r.id === created.id) ?? created;
                      addReview(mapReview(latest), true);
                    } else {
                      addReview({
                        id: `r-${Date.now()}`,
                        productId,
                        author: user.name,
                        rating,
                        date: t('common:now'),
                        text: reviewText,
                        photoUrls:
                          photoFiles.length > 0
                            ? photoFiles.map((_, i) => `mock://photo${i + 1}`)
                            : undefined,
                      });
                    }
                    navigate(returnTo);
                  } catch {
                    show(t('review.submitFailed'), 'error');
                  } finally {
                    setSubmitting(false);
                  }
                };

                void submit();
              }}
            >
              {submitting ? t('common:sending') : t('review.submit')}
            </Button>
          </FormActions>
        </div>
      </SubPageLayout>
    </div>
  );
}

const RETURN_REASON_KEYS = ['defect', 'wrong', 'regret', 'expectations', 'other'] as const;

export function ReturnPage() {
  const { t } = useTranslation('orders');
  const { orderId } = useParams<{ orderId: string }>();
  const order = useOrder(orderId);
  const { getProduct } = useCatalog();

  const returnReasons = useMemo(
    () => RETURN_REASON_KEYS.map((key) => t(`return.reasons.${key}`)),
    [t],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const resolvedReason = reason || returnReasons[0];
  const title = order?.status === 'DELIVERED' ? t('return.returnTitle') : t('return.cancelTitle');

  if (!order) {
    return (
      <div data-screen-label={screenLabel('return')}>
        <SubPageLayout title={title} backTo={routes.orders}>
          <PanelCard className="p-8 text-center text-muted-foreground">{t('detail.notFound')}</PanelCard>
        </SubPageLayout>
      </div>
    );
  }

  if (submitted) {
    return (
      <div data-screen-label={screenLabel('return')}>
        <SubPageLayout title={title} backTo={routes.order(order.id)}>
          <PanelCard className="flex flex-col items-center gap-2 p-8 text-center">
            <div className="text-lg font-extrabold text-success">{t('return.successTitle')}</div>
            <p className="m-0 text-sm text-muted-foreground">
              {t('return.successBody')}
            </p>
          </PanelCard>
        </SubPageLayout>
      </div>
    );
  }

  return (
    <div data-screen-label={screenLabel('return')}>
      <SubPageLayout title={title} backTo={routes.order(order.id)}>
        <div className="flex flex-col gap-4">
          <h3 className="m-0 text-base font-extrabold">{t('return.selectItem')}</h3>
          {order.productIds.map((line, index) => {
            const product = getProduct(line.id);
            return (
              <label
                key={`${line.id}-${index}`}
                className="flex cursor-pointer items-center gap-3 rounded-xl py-1"
              >
                <input
                  type="radio"
                  checked={selectedIndex === index}
                  onChange={() => setSelectedIndex(index)}
                  className="size-4"
                />
                <img src={product.img} alt="" className="size-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm">{product.title}</div>
                  <div className="text-xs text-muted-foreground">{t('common:quantity')}: {line.qty}</div>
                </div>
              </label>
            );
          })}

          <FormField label={t('return.reasonLabel')}>
            <select
              value={resolvedReason}
              onChange={(e) => setReason(e.target.value)}
              className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {returnReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={t('return.descriptionLabel')}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('return.descriptionPlaceholder')}
              className="min-h-[120px] w-full resize-y rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </FormField>

          <FormActions>
            <Button
              className="h-12 w-full rounded-lg text-base font-bold"
              onClick={() => setSubmitted(true)}
            >
              {t('return.submit')}
            </Button>
          </FormActions>
        </div>
      </SubPageLayout>
    </div>
  );
}
