import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { mapSubscription } from '@/api/mappers';
import { cityboxApi } from '@/api/citybox-api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AppContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { cn } from '@/lib/utils';

const SUBSCRIPTION_BANNER_STYLE = {
  backgroundImage:
    'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(/assets/banners/citybox-plus.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
} as const;

export function SubscriptionPlanBanner({
  title,
  subtitle,
  footer,
  className,
}: {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[14px] bg-gradient-to-br from-[#2d2d44] to-[#161616] p-6 text-white',
        className,
      )}
      style={SUBSCRIPTION_BANNER_STYLE}
    >
      <div className="text-3xl">✦</div>
      <div className="mt-2 text-xl font-extrabold">{title}</div>
      <div className="mt-1 text-sm opacity-80">{subtitle}</div>
      {footer}
    </div>
  );
}

export function UserProfileCard({ onEdit }: { onEdit: () => void }) {
  const { t } = useTranslation('account');
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-4 rounded-[14px] bg-card p-5 shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-extrabold text-brand-foreground">
        {user.avatarInitial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[19px] font-extrabold text-[rgba(0,0,0,0.9)]">{user.name}</div>
        <div className="text-[13px] text-muted-foreground">{user.email}</div>
      </div>
      <button
        type="button"
        className="cursor-pointer text-[13px] font-bold whitespace-nowrap text-foreground"
        onClick={onEdit}
      >
        {t('profile.edit')}
      </button>
    </div>
  );
}

export function MembershipCard({ onManage }: { onManage: () => void }) {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const { data } = useAsyncData(() => cityboxApi.getSubscription(), []);
  const sub = data ? mapSubscription(data) : null;
  const renewalDate = sub?.renewalDate ?? '—';

  return (
    <aside>
      <SubscriptionPlanBanner
        title={user.isPlus ? t('subscription.planActive') : t('subscription.noSubscription')}
        subtitle={t('subscription.renewal', { date: renewalDate })}
        footer={
          <Button
            variant="secondary"
            className="mt-[18px] h-[46px] w-full rounded-lg bg-white text-sm font-bold text-brand hover:bg-white/90"
            onClick={onManage}
          >
            {t('subscription.manage')}
          </Button>
        }
      />
    </aside>
  );
}

export function OrderConfirmationCard({
  orderNo,
  totalFmt,
  arrivalText,
  onTrack,
  onHome,
}: {
  orderNo?: string;
  totalFmt?: string;
  arrivalText: string;
  onTrack: () => void;
  onHome: () => void;
}) {
  const { t } = useTranslation('orders');

  return (
    <div className="flex w-full max-w-[460px] flex-col items-center rounded-[14px] bg-card p-[clamp(28px,5vw,48px)] text-center shadow-[0_1px_6px_rgba(0,0,0,0.08)]">
      <div className="flex size-[88px] items-center justify-center rounded-full bg-[#e5f7ed]">
        <div className="flex size-[60px] items-center justify-center rounded-full bg-success">
          <svg className="animate-cbcheck size-8 stroke-white stroke-[3]" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h1 className="mt-5 mb-1.5 text-[25px] font-extrabold">{t('confirmation.title')}</h1>
      <p className="m-0 text-[15px] leading-normal text-muted-foreground">{t('confirmation.subtitle')}</p>
      <div className="my-6 w-full rounded-xl border border-black/10 p-[18px] text-left">
        <div className="flex justify-between py-[5px] text-[13px]">
          <span className="text-muted-foreground">{t('confirmation.orderNumber')}</span>
          <span className="font-bold">#{orderNo}</span>
        </div>
        <div className="flex justify-between py-[5px] text-[13px]">
          <span className="text-muted-foreground">{t('confirmation.totalPaid')}</span>
          <span className="font-bold">{totalFmt}</span>
        </div>
        <div className="flex justify-between py-[5px] text-[13px]">
          <span className="text-muted-foreground">{t('confirmation.delivery')}</span>
          <span className="font-bold text-success">{arrivalText}</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Button className="h-[50px] w-full rounded-lg text-base font-bold" onClick={onTrack}>
          {t('confirmation.track')}
        </Button>
        <Button variant="outline" className="h-[50px] w-full rounded-lg text-base font-bold" onClick={onHome}>
          {t('confirmation.home')}
        </Button>
      </div>
    </div>
  );
}
