import { useTranslation } from 'react-i18next';
import { Check, Clock, MapPin } from 'lucide-react';
import type { OrderStatus, OrderStatusEntry } from '@/types';
import { cn } from '@/lib/utils';

const TRACKING_STATUSES: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'];

const STATUS_ORDER: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'];

function statusKey(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURN_REQUESTED: 'returnRequested',
    RETURNED: 'returned',
  };
  return map[status];
}

export function useOrderStatusLabel(status: OrderStatus): string {
  const { t } = useTranslation('orders');
  return t(`status.${statusKey(status)}`);
}

export function orderStatusIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status);
}

export function orderStatusBadgeClass(_status: OrderStatus): string {
  return 'bg-brand/10 text-brand';
}

export function TrackingTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  const { t } = useTranslation('orders');
  const currentIndex = orderStatusIndex(currentStatus);

  return (
    <div className="flex w-full items-start py-2">
      {TRACKING_STATUSES.map((stepStatus, index) => {
        const isDone = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const label = t(`status.${statusKey(stepStatus)}`);

        return (
          <div key={stepStatus} className="flex min-w-0 flex-1 items-start last:flex-none last:min-w-[4.5rem]">
            <div className="flex w-[4.5rem] shrink-0 flex-col items-center">
              <div
                className={cn(
                  'flex size-5 items-center justify-center rounded-full',
                  isDone ? 'bg-success' : 'border border-black/15 bg-black/[0.04]',
                )}
              >
                {isDone && !isCurrent && <Check className="size-2.5 stroke-[3] text-white" />}
                {isCurrent && <div className="size-1.5 rounded-full bg-white" />}
              </div>
              <span
                className={cn(
                  'mt-1 text-center text-[10px] leading-tight font-semibold',
                  isDone ? 'text-success' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
            {index < TRACKING_STATUSES.length - 1 && (
              <div
                className={cn(
                  'mt-2 h-0.5 min-w-2 flex-1',
                  index < currentIndex ? 'bg-success' : 'bg-black/[0.06]',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DetailedTrackingStep({
  entry,
  isLast,
  isActive,
}: {
  entry: OrderStatusEntry;
  isLast: boolean;
  isActive: boolean;
}) {
  const { t } = useTranslation('orders');

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex size-6 items-center justify-center rounded-full',
            isActive ? 'bg-success' : 'bg-success',
          )}
        >
          {!isActive ? (
            <Check className="size-3 stroke-[3] text-white" />
          ) : (
            <div className="size-2 rounded-full bg-white" />
          )}
        </div>
        {!isLast && (
          <div className={cn('w-0.5 flex-1 min-h-12', isActive ? 'bg-black/[0.06]' : 'bg-success')} />
        )}
      </div>
      <div className={cn('min-w-0 flex-1', !isLast && 'pb-4')}>
        <div className={cn('text-sm font-bold', isActive ? 'text-success' : 'text-foreground')}>
          {t(`status.${statusKey(entry.status)}`)}
        </div>
        <div className="text-xs text-muted-foreground">{entry.date}</div>
        {entry.location && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {entry.location}
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderDetailHeader({
  orderId,
  status,
  deliveryDate,
  trackingCode,
}: {
  orderId: string;
  status: OrderStatus;
  deliveryDate: string;
  trackingCode: string;
}) {
  const { t } = useTranslation('orders');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-lg font-extrabold">{t('detail.title', { id: orderId })}</h2>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-bold',
            orderStatusBadgeClass(status),
          )}
        >
          {t(`status.${statusKey(status)}`)}
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3.5" />
        {deliveryDate}
      </div>
      {trackingCode && <div className="text-xs font-semibold text-success">{t('detail.tracking', { code: trackingCode })}</div>}
    </div>
  );
}

export function SummaryLine({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className={bold ? 'font-bold text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className={cn('font-medium', bold && 'text-lg font-extrabold', highlight && 'text-success')}>
        {value}
      </span>
    </div>
  );
}

/** @deprecated Use useOrderStatusLabel hook */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CONFIRMED: 'status.confirmed',
  PREPARING: 'status.preparing',
  SHIPPED: 'status.shipped',
  DELIVERED: 'status.delivered',
  CANCELLED: 'status.cancelled',
  RETURN_REQUESTED: 'status.returnRequested',
  RETURNED: 'status.returned',
};
