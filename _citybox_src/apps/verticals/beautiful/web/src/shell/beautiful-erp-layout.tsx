'use client';

import { Suspense, useMemo, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import {
  AppDashboardLayout,
  Logo,
  type AppSidebarNavGroup,
  type AppSidebarNavItem,
} from '@citybox/mui';
import { Icon } from '@citybox/mui/icons';
import {
  BEAUTIFUL_FOOTER_MODULES,
  BEAUTIFUL_NAV_SECTIONS,
  type BeautifulNavModule,
} from '@/lib/navigation';
import {
  filterBeautifulFooterModules,
  filterBeautifulNavSections,
  resolveBeautifulModulePath,
} from '@/lib/beautiful-nav-permissions';
import { useSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';
import { BeautifulHeader } from '@/shell/beautiful-header';

function BeautifulLink({
  href,
  children,
  onClick,
  style,
  className,
}: {
  href: string;
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <Link href={href} onClick={onClick} style={style} className={className}>
      {children}
    </Link>
  );
}

function pathAndQuery(fullPath: string): { pathname: string; query: string } {
  const [pathname, query = ''] = fullPath.split('?');
  return { pathname, query };
}

function isNavModuleActive(
  mod: BeautifulNavModule,
  pathname: string,
  search: string,
): boolean {
  // Módulos com abas: ativo em qualquer subrota, mesmo se o href apontar à 1ª aba autorizada.
  if (mod.id === 'settings') {
    return (
      pathname === '/configuracoes' || pathname.startsWith('/configuracoes/')
    );
  }
  if (mod.id === 'catalogo') {
    return pathname === '/catalogo' || pathname.startsWith('/catalogo/');
  }
  if (mod.id === 'financeiro') {
    return pathname === '/financeiro' || pathname.startsWith('/financeiro/');
  }

  const target = pathAndQuery(mod.path);

  if (pathname !== target.pathname) {
    if (target.pathname === '/') return false;
    if (!target.query && pathname.startsWith(`${target.pathname}/`)) {
      return true;
    }
    return false;
  }

  if (!target.query) {
    // Exact path without query loses to a sibling that matches the current query.
    if (!search) return true;
    const siblings = BEAUTIFUL_NAV_SECTIONS.flatMap((s) => s.modules).filter(
      (m) => pathAndQuery(m.path).pathname === pathname && pathAndQuery(m.path).query,
    );
    return !siblings.some((m) => pathAndQuery(m.path).query === search);
  }

  return target.query === search;
}

function toNavItem(
  mod: BeautifulNavModule,
  pathname: string,
  search: string,
  permissions: string[],
  isOrganizationOwner: boolean,
): AppSidebarNavItem {
  const isActive = isNavModuleActive(mod, pathname, search);
  const url = resolveBeautifulModulePath(
    mod.id,
    mod.path,
    permissions,
    isOrganizationOwner,
  );

  return {
    id: mod.id,
    title: mod.label,
    url,
    icon: (
      <Icon
        name={mod.icon}
        size={20}
        variant={isActive ? 'bold' : 'linear'}
      />
    ),
    isActive,
  };
}

function BeautifulErpShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const { logout } = useSession();
  const { storeId, stores } = useStore();
  const muiTheme = useTheme();
  const brandColor = muiTheme.palette.primary.main;
  const activeStore = stores.find((s) => s.id === storeId);
  const permissions = activeStore?.permissions ?? [];
  const isOrganizationOwner = activeStore?.isOrganizationOwner === true;

  const navGroups: AppSidebarNavGroup[] = useMemo(() => {
    const sections = filterBeautifulNavSections(
      BEAUTIFUL_NAV_SECTIONS,
      permissions,
      isOrganizationOwner,
    );
    return sections.map((section) => ({
      label: section.label,
      items: section.modules.map((mod) =>
        toNavItem(mod, pathname, search, permissions, isOrganizationOwner),
      ),
    }));
  }, [isOrganizationOwner, pathname, permissions, search]);

  const footerNavItems = useMemo((): AppSidebarNavItem[] => {
    const footer = filterBeautifulFooterModules(
      BEAUTIFUL_FOOTER_MODULES,
      permissions,
      isOrganizationOwner,
    );
    return [
      ...footer.map((mod) =>
        toNavItem(mod, pathname, search, permissions, isOrganizationOwner),
      ),
      {
        id: 'logout',
        title: 'Sair',
        icon: <Icon name="logout" size={20} />,
        onClick: () => {
          void logout();
        },
      },
    ];
  }, [isOrganizationOwner, logout, pathname, permissions, search]);

  return (
    <AppDashboardLayout
      header={<BeautifulHeader />}
      mainSx={{
        p: 3,
        minHeight: 0,
        minWidth: 0,
        overflow: 'auto',
      }}
      sidebar={{
        navGroups,
        footerNavItems,
        collapsible: 'icon',
        brandNode: <Logo variant="full" height={28} brandColor={brandColor} />,
        brandNodeCollapsed: (
          <Logo variant="symbol" height={32} brandColor={brandColor} />
        ),
        linkComponent: BeautifulLink,
      }}
    >
      {children}
    </AppDashboardLayout>
  );
}

export function BeautifulErpLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <BeautifulErpShell>{children}</BeautifulErpShell>
    </Suspense>
  );
}
