'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, UserPlus } from 'lucide-react';
import { PageNav } from '@citybox/ui/molecules';
import type { PageNavItem, PageNavLinkProps } from '@citybox/ui/molecules';

const MARKETING_BASE = '/marketing';

function NextPageNavLink({ href, children, ...props }: PageNavLinkProps) {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

function resolveCurrentPath(pathname: string): string {
  if (pathname.startsWith(`${MARKETING_BASE}/indicacoes`)) {
    return `${MARKETING_BASE}/indicacoes`;
  }
  return `${MARKETING_BASE}/campaigns`;
}

/** Navegação horizontal Comunicação | Indicações (padrão Financeiro). */
export function ComunicacaoNav() {
  const pathname = usePathname();

  const items: PageNavItem[] = [
    {
      label: 'Comunicação',
      href: `${MARKETING_BASE}/campaigns`,
      icon: Megaphone,
    },
    {
      label: 'Indicações',
      href: `${MARKETING_BASE}/indicacoes`,
      icon: UserPlus,
    },
  ];

  return (
    <PageNav
      items={items}
      currentPath={resolveCurrentPath(pathname)}
      linkComponent={NextPageNavLink}
      scrollMode="buttons"
      buttonsHideFrom="xl"
      className="bg-background px-4"
      aria-label="Navegação de Comunicação"
    />
  );
}
