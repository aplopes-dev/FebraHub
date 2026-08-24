"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightLeft, BadgeDollarSign, Receipt, Settings } from "lucide-react";

import { PageNav } from "@citybox/ui/molecules";
import type { PageNavItem, PageNavLinkProps } from "@citybox/ui/molecules";
import { useFinancialPermissions } from "../hooks/use-financial-permissions";

const FINANCIAL_BASE = "/financeiro";

function NextPageNavLink({ href, children, ...props }: PageNavLinkProps) {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

/** Navegação horizontal do Financeiro (padrão da vertical clínica). */
export function FinancialNav() {
  const pathname = usePathname();
  const {
    canAccessCashFlow,
    canAccessTransactions,
    canAccessCommissions,
    canAccessSettings,
  } = useFinancialPermissions();

  const items: PageNavItem[] = [
    ...(canAccessCashFlow
      ? [
          {
            label: "Fluxo de caixa",
            href: `${FINANCIAL_BASE}/fluxo-de-caixa`,
            icon: ArrowRightLeft,
          } satisfies PageNavItem,
        ]
      : []),
    ...(canAccessTransactions
      ? [
          {
            label: "Transações",
            href: `${FINANCIAL_BASE}/transacoes`,
            icon: Receipt,
          } satisfies PageNavItem,
        ]
      : []),
    ...(canAccessCommissions
      ? [
          {
            label: "Comissões",
            href: `${FINANCIAL_BASE}/comissoes`,
            icon: BadgeDollarSign,
          } satisfies PageNavItem,
        ]
      : []),
    ...(canAccessSettings
      ? [
          {
            label: "Configurações",
            href: `${FINANCIAL_BASE}/configuracoes`,
            icon: Settings,
          } satisfies PageNavItem,
        ]
      : []),
  ];

  if (items.length === 0) {
    return null;
  }

  return (
    <PageNav
      items={items}
      currentPath={pathname}
      linkComponent={NextPageNavLink}
      scrollMode="buttons"
      buttonsHideFrom="xl"
      className="-mx-4 -mt-4 bg-background px-4"
      aria-label="Navegação do Financeiro"
    />
  );
}
