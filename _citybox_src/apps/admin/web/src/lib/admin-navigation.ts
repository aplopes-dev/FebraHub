import type { SidebarNavGroup } from "@citybox/ui/organisms";
import {
  LayoutDashboard,
  CreditCard,
  ShieldCheck,
  Settings,
  Wallet,
  Store,
  Users,
} from "lucide-react";

export type AdminBreadcrumb = {
  label: string;
  href?: string;
};

type AdminNavItem = Omit<SidebarNavGroup["items"][number], "isActive">;

type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Menu",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      {
        // "Clientes" agora É a loja: desde PLAT-001 a Store é a unidade de billing e
        // absorveu os dados do antigo Cliente. Não existe mais entidade acima dela.
        title: "Clientes",
        url: "/clientes",
        icon: Store,
      },
      {
        title: "Financeiro",
        url: "/financeiro",
        icon: Wallet,
      },
      {
        title: "Planos",
        url: "/planos",
        icon: CreditCard,
      },
      {
        title: "Usuários",
        url: "/usuarios",
        icon: Users,
      },
    ],
  },
  {
    label: "Configurações",
    items: [
      {
        title: "Auditoria",
        url: "/audit",
        icon: ShieldCheck,
      },
      {
        title: "Configurações",
        url: "/config/settings",
        icon: Settings,
      },
    ],
  },
];

export function isNavActive(url: string, pathname: string): boolean {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function buildAdminNavGroups(pathname: string): SidebarNavGroup[] {
  return ADMIN_NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.map((item) => ({
      ...item,
      isActive: isNavActive(item.url, pathname),
    })),
  }));
}

const LEGACY_PAGE_TITLES: Record<string, string> = {
  "/onboarding": "Onboarding",
  "/onboarding/stores": "Lojas",
  "/config/billing": "Verticais & Planos",
  "/finance/settlements": "Repasse",
  "/audit": "Auditoria",
};

export function getAdminPageTitle(pathname: string): string {
  const items = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
  const active = items
    .filter((item) => isNavActive(item.url, pathname))
    .sort((a, b) => b.url.length - a.url.length)[0];

  if (active) return active.title;

  return LEGACY_PAGE_TITLES[pathname] ?? "Dashboard";
}

const FINANCEIRO_SUBPAGE_TITLES: Record<string, string> = {
  "/financeiro/faturas-e-cobrancas": "Faturas e Cobranças",
  "/financeiro/assinaturas": "Assinaturas",
  "/financeiro/gateway": "Gateway",
};

export function getAdminBreadcrumbs(
  pathname: string,
): AdminBreadcrumb[] | null {
  if (pathname.match(/^\/clientes\/([^/]+)$/)) {
    return [{ label: "Clientes", href: "/clientes" }, { label: "Detalhes" }];
  }

  if (pathname.startsWith("/financeiro/")) {
    const subpageTitle = FINANCEIRO_SUBPAGE_TITLES[pathname];
    if (subpageTitle) {
      return [
        { label: "Financeiro", href: "/financeiro" },
        { label: subpageTitle },
      ];
    }
  }

  return null;
}
