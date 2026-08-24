import { useEffect, useMemo } from 'react';
import { screenLabel } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { useCatalog, useOrders } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import { EmptyState } from '@/components/shared/empty-state';
import { PageTitle, PanelCard, TwoColumnLayout } from '@/components/shared/layout-primitives';
import { routes } from '@/lib/routes';
import { brlFull } from '@/utils/format';
import type { OrderStatus } from '@/types';

const STATUS_KEY_MAP: Record<OrderStatus, string> = {
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURN_REQUESTED: 'returnRequested',
  RETURNED: 'returned',
};

export function OrdersPage() {
  const { t } = useTranslation('orders');
  const navigate = useNavigate();
  const { orders, advanceOrderStatus } = useOrders();
  const { getProduct } = useCatalog();
  const { ordersCols } = useLayout();

  const statusLabels = useMemo(
    () =>
      Object.fromEntries(
        (Object.entries(STATUS_KEY_MAP) as [OrderStatus, string][]).map(([status, key]) => [
          status,
          t(`status.${key}`),
        ]),
      ) as Record<OrderStatus, string>,
    [t],
  );

  useEffect(() => {
    const timer = window.setInterval(advanceOrderStatus, 20000);
    return () => window.clearInterval(timer);
  }, [advanceOrderStatus]);

  return (
    <div data-screen-label={screenLabel('orders')}>
      <PageTitle>{t('page.title')}</PageTitle>
      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('empty.title')}
          description={t('empty.description')}
          actionLabel={t('empty.action')}
          onAction={() => navigate(routes.home)}
        />
      ) : (
        <TwoColumnLayout columns={ordersCols} className="gap-4">
          {orders.map((order) => {
            const firstItem = order.productIds[0];
            const product = firstItem ? getProduct(firstItem.id) : null;
            const title = product?.title ?? t('list.fallbackTitle');
            const extra = order.productIds.length > 1 ? t('list.extraItems', { count: order.productIds.length - 1 }) : '';

            return (
              <PanelCard
                key={order.id}
                role="button"
                tabIndex={0}
                aria-label={t('list.ariaOrder', { orderId: order.id })}
                className="cursor-pointer p-4 transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                onClick={() => navigate(routes.order(order.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(routes.order(order.id));
                  }
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">{t('list.orderLabel', { orderId: order.id })}</div>
                    <div className="mt-1 font-bold">
                      {title.slice(0, 48)}
                      {title.length > 48 ? '…' : ''}
                      {extra}
                    </div>
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-muted-foreground">
                  <span>{t('list.total', { price: brlFull(order.total) })}</span>
                  <span>{order.deliveryDate}</span>
                  {order.trackingCode && <span>{t('list.tracking', { code: order.trackingCode })}</span>}
                </div>
              </PanelCard>
            );
          })}
        </TwoColumnLayout>
      )}
    </div>
  );
}
