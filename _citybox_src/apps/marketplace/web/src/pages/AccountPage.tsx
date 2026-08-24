import { useMemo } from 'react';
import { screenLabel } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  Heart,
  Info,
  Lock,
  LogOut,
  MapPin,
  Settings,
  ShoppingBag,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { useAuth, useOrders } from '@/context/AppContext';
import { useFavoriteIds } from '@/state/favorites-store';
import { useLayout } from '@/hooks/useLayout';
import { MembershipCard, UserProfileCard } from '@/components/account/account-components';
import { PageTitle, PanelCard, TwoColumnLayout } from '@/components/shared/layout-primitives';
import { routes } from '@/lib/routes';

type AccountMenuItem = {
  icon: LucideIcon;
  label: string;
  to: string;
  subtitleKey?: 'orders' | 'favs';
};

export function AccountPage() {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const { cartCols } = useLayout();
  const { orders } = useOrders();
  const favoriteIds = useFavoriteIds();
  const { logout } = useAuth();

  const menuPrimary = useMemo<AccountMenuItem[]>(
    () => [
      { icon: ShoppingBag, label: t('menu.orders'), to: routes.orders, subtitleKey: 'orders' },
      { icon: Heart, label: t('menu.favorites'), to: routes.favorites, subtitleKey: 'favs' },
      { icon: Tag, label: t('menu.coupons'), to: routes.coupons },
      { icon: MapPin, label: t('menu.addresses'), to: routes.addresses },
      { icon: CreditCard, label: t('menu.cards'), to: routes.cards },
      { icon: Bell, label: t('menu.notifications'), to: routes.notifications },
      { icon: CircleHelp, label: t('menu.help'), to: routes.help },
      { icon: Settings, label: t('menu.settings'), to: routes.settings },
    ],
    [t],
  );

  const menuSecondary = useMemo<AccountMenuItem[]>(
    () => [
      { icon: Info, label: t('menu.about'), to: routes.staticPage('sobre') },
      { icon: FileText, label: t('menu.terms'), to: routes.staticPage('termos') },
      { icon: Lock, label: t('menu.privacy'), to: routes.staticPage('privacidade') },
    ],
    [t],
  );

  const subtitle = (key?: 'orders' | 'favs') => {
    if (key === 'orders') return t('page.ordersCount', { count: orders.length });
    if (key === 'favs') return t('page.favoritesCount', { count: favoriteIds.length });
    return undefined;
  };

  return (
    <div data-screen-label={screenLabel('account')}>
      <PageTitle>{t('page.title')}</PageTitle>
      <TwoColumnLayout columns={cartCols}>
        <div className="flex flex-col gap-4">
          <UserProfileCard onEdit={() => navigate(routes.profile)} />
          <AccountMenuCard
            items={menuPrimary}
            onNavigate={(to) => navigate(to)}
            subtitle={subtitle}
          />
          <AccountMenuCard items={menuSecondary} onNavigate={(to) => navigate(to)} />
          <PanelCard className="overflow-hidden py-0">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-2 px-[18px] py-4 text-destructive"
              onClick={logout}
            >
              <LogOut className="size-4" />
              <span className="text-[15px] font-bold">{t('page.logout')}</span>
            </button>
          </PanelCard>
          <p className="text-center text-xs text-muted-foreground">{t('common:versionFooter')}</p>
        </div>
        <MembershipCard onManage={() => navigate(routes.subscription)} />
      </TwoColumnLayout>
    </div>
  );
}

function AccountMenuCard({
  items,
  onNavigate,
  subtitle,
}: {
  items: readonly AccountMenuItem[];
  onNavigate: (to: string) => void;
  subtitle?: (key?: 'orders' | 'favs') => string | undefined;
}) {
  return (
    <PanelCard className="overflow-hidden py-0">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
        <button
          key={item.label}
          type="button"
          className="flex w-full cursor-pointer items-center gap-3 px-[18px] py-4 text-left"
          style={{ borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
          onClick={() => onNavigate(item.to)}
        >
          <span className="flex w-7 shrink-0 items-center justify-center">
            <Icon className="size-[18px] text-black" strokeWidth={2} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-[15px] text-[rgba(0,0,0,0.85)]">{item.label}</span>
            {item.subtitleKey && subtitle?.(item.subtitleKey) && (
              <span className="text-xs text-muted-foreground">{subtitle(item.subtitleKey)}</span>
            )}
          </span>
          <ChevronRight className="size-[18px] stroke-black/30" />
        </button>
        );
      })}
    </PanelCard>
  );
}

export { FavoritesPage } from './FavoritesPage';
