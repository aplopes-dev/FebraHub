import { Outlet, useLocation } from 'react-router-dom';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { PageContainer } from '@/components/shared/layout-primitives';
import { useLayout } from '@/hooks/useLayout';

export function AppShell() {
  const { mainPad, mainPadHome } = useLayout();
  const isHome = useLocation().pathname === '/';

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-surface">
      <SiteHeader />
      <PageContainer style={{ padding: isHome ? mainPadHome : mainPad }}>
        <Outlet />
      </PageContainer>
      <SiteFooter />
    </div>
  );
}
