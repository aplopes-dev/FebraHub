import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from '@/components/brand/logo';
import { CartNavButton } from '@/components/navigation/cart-nav-button';
import { NotificationsNavButton } from '@/components/navigation/notifications-nav-button';
import { HeaderNavLinks } from '@/components/navigation/header-nav-links';
import { MobileNavSheet } from '@/components/navigation/mobile-nav-sheet';
import { HeaderSearchBar } from '@/components/search/header-search-bar';
import { useLayout } from '@/hooks/useLayout';
import { useShipToLabel } from '@/hooks/useShipToLabel';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const { t } = useTranslation('nav');
  const { headerPad, headerGap, showNavLinks, isMobile } = useLayout();
  const headerRef = useRef<HTMLElement>(null);
  const shipToLabel = useShipToLabel(t('shipToFallback'));

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty(
        '--site-header-height',
        `${header.offsetHeight}px`,
      );
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [showNavLinks]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-brand text-brand-foreground"
    >
      <div
        className={cn('mx-auto flex max-w-[1280px] items-center')}
        style={{ padding: headerPad, gap: headerGap }}
      >
        <MobileNavSheet />
        <Link to="/" className="flex shrink-0 cursor-pointer items-center gap-2 text-inherit">
          <BrandMark showName={!isMobile} />
        </Link>
        <HeaderSearchBar />
        {showNavLinks && <HeaderNavLinks />}
        <NotificationsNavButton />
        <CartNavButton />
      </div>
      {showNavLinks && (
        <div className="mx-auto flex max-w-[1280px] items-center gap-[18px] px-8 pb-2 text-[13px] text-white/85">
          <span className="flex cursor-pointer items-center gap-1.5">
            <MapPin className="size-3.5" />
            {t('shipTo')} <strong className="text-white">{shipToLabel}</strong>
          </span>
        </div>
      )}
    </header>
  );
}
