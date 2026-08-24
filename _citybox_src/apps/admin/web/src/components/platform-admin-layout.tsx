'use client';

import Link from 'next/link';
import { useEffect, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@citybox/ui/organisms';
import { Logo } from '@citybox/ui/molecules';
import { Skeleton } from '@citybox/ui/atoms';
import { AdminHeader } from '@/components/admin-header';
import { buildAdminNavGroups, getAdminBreadcrumbs, getAdminPageTitle } from '@/lib/admin-navigation';
import { useSession } from '@/lib/session-context';

function DashboardSkeleton() {
  return (
    <div className="flex min-h-svh">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 flex-col gap-3 border-r border-transparent p-4 md:flex">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-4 h-4 w-20" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="mt-4 h-4 w-20" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <div className="space-y-4 p-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-96" />
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status, session, logout } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'anonymous') return;
    window.location.replace('/login?reauth=1');
  }, [status]);

  const navGroups = useMemo(() => buildAdminNavGroups(pathname), [pathname]);
  const pageTitle = useMemo(() => getAdminPageTitle(pathname), [pathname]);
  const breadcrumbs = useMemo(() => getAdminBreadcrumbs(pathname), [pathname]);

  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  const userName = session?.user.name ?? 'CityBox Admin';
  const userEmail = session?.user.email ?? '';

  const header = useMemo(
    () => (
      <AdminHeader
        pageTitle={pageTitle}
        breadcrumbs={breadcrumbs}
        userName={userName}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
    ),
    [pageTitle, breadcrumbs, userName, userEmail, handleLogout],
  );

  if (status === 'loading' || status === 'anonymous') {
    return <DashboardSkeleton />;
  }

  return (
    <AppSidebar
      navGroups={navGroups}
      brandLogo={
        <Logo className="h-8 text-foreground" brandGradient="primary" />
      }
      brandLogoCollapsed={
        <Logo variant="symbol" className="h-8" brandGradient="primary" />
      }
      header={header}
      linkComponent={Link}
    >
      {children}
    </AppSidebar>
  );
}
