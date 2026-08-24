'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PageNav,
  type PageNavItem,
  type PageNavLinkProps,
} from '@citybox/ui/molecules';
import { useCan } from '@/features/clinic/permissions';

const DASHBOARD_NAV_ITEMS: Array<
  PageNavItem & { action: 'read' | 'access' }
> = [
  { label: 'Indicadores', href: '/', end: true, action: 'read' },
  { label: 'Relatórios', href: '/relatorios', end: true, action: 'read' },
  { label: 'Tarefas', href: '/tarefas', end: true, action: 'access' },
];

function NextPageNavLink({ href, children, ...props }: PageNavLinkProps) {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

export function DashboardRouteNav() {
  const pathname = usePathname();
  const canRead = useCan('read', 'Dashboard');
  const canAccessTasks = useCan('access', 'Dashboard');

  const items = DASHBOARD_NAV_ITEMS.filter((item) => {
    if (item.action === 'read') return canRead;
    return canAccessTasks;
  }).map(({ action: _action, ...item }) => item);

  if (items.length === 0) return null;

  return (
    <PageNav
      items={items}
      currentPath={pathname}
      linkComponent={NextPageNavLink}
      className="-mx-4 -mt-4 bg-background px-4"
      aria-label="Navegação do dashboard da Clínica"
    />
  );
}
