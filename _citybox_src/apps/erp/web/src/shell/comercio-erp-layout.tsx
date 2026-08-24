"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DualDashboardLayout,
  Typography,
  type DualSidebarNavGroup,
  type DualSidebarNavItem,
} from "@citybox/mui";
import { Logo } from "@citybox/ui/molecules";
import { NavIcon } from "@/lib/nav-icons";
import {
  COMERCIO_FOOTER_MODULES,
  COMERCIO_NAV_SECTIONS,
  findModuleByPath,
  moduleHasPanel,
  type ComercioNavModule,
} from "@/lib/navigation";
import { ComercioPanelMenu } from "@/shell/panel-menu";
import { ComercioHeader } from "@/shell/comercio-header";

function toRailItem(
  module: ComercioNavModule,
  highlightModuleId: string | undefined,
): DualSidebarNavItem {
  const isActive = module.id === highlightModuleId;
  return {
    id: module.id,
    title: module.label,
    url: module.path,
    icon: <NavIcon name={module.icon} size={18} />,
    isActive,
  };
}

function buildNavGroups(
  highlightModuleId: string | undefined,
): DualSidebarNavGroup[] {
  return COMERCIO_NAV_SECTIONS.map((section) => ({
    label: section.label,
    items: section.modules.map((mod) => toRailItem(mod, highlightModuleId)),
  }));
}

function buildFooterItems(
  highlightModuleId: string | undefined,
): DualSidebarNavItem[] {
  return COMERCIO_FOOTER_MODULES.map((mod) =>
    toRailItem(mod, highlightModuleId),
  );
}

function findModuleByRailTitle(title: string): ComercioNavModule | undefined {
  return [
    ...COMERCIO_NAV_SECTIONS.flatMap((s) => s.modules),
    ...COMERCIO_FOOTER_MODULES,
  ].find((mod) => mod.label === title);
}

function findModuleById(id: string): ComercioNavModule | undefined {
  return [
    ...COMERCIO_NAV_SECTIONS.flatMap((s) => s.modules),
    ...COMERCIO_FOOTER_MODULES,
  ].find((mod) => mod.id === id);
}

function ComercioLink({
  href,
  children,
  onClick,
  style,
  className,
}: {
  href: string;
  children?: ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <Link href={href} onClick={onClick} style={style} className={className}>
      {children}
    </Link>
  );
}

function ComercioErpShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const routeModule = findModuleByPath(pathname);

  const [panelOpen, setPanelOpen] = useState(() =>
    Boolean(routeModule && moduleHasPanel(routeModule)),
  );
  const [panelModuleId, setPanelModuleId] = useState<string | null>(() =>
    routeModule && moduleHasPanel(routeModule) ? routeModule.id : null,
  );

  useEffect(() => {
    if (routeModule && moduleHasPanel(routeModule)) {
      setPanelModuleId(routeModule.id);
      setPanelOpen(true);
      return;
    }
    if (routeModule && !moduleHasPanel(routeModule)) {
      setPanelOpen(false);
      setPanelModuleId(null);
    }
  }, [pathname, routeModule]);

  const highlightModuleId =
    panelOpen && panelModuleId ? panelModuleId : routeModule?.id;

  const panelModule =
    panelModuleId != null ? findModuleById(panelModuleId) : undefined;

  const navGroups = buildNavGroups(highlightModuleId);
  const footerNavItems = buildFooterItems(highlightModuleId);

  return (
    <DualDashboardLayout
      header={<ComercioHeader />}
      mainSx={{
        p: 3,
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
      sidebar={{
        panelOpen,
        panelCloseLabel: "Fechar menu",
        panelOpenLabel: "Abrir menu",
        onPanelOpenChange: (open) => {
          setPanelOpen(open);
          if (
            open &&
            panelModuleId == null &&
            routeModule &&
            moduleHasPanel(routeModule)
          ) {
            setPanelModuleId(routeModule.id);
          }
        },
        onRailItemSelect: (item) => {
          const mod = findModuleByRailTitle(item.title);
          if (mod && moduleHasPanel(mod)) {
            setPanelModuleId(mod.id);
            setPanelOpen(true);
            return;
          }
          setPanelOpen(false);
          setPanelModuleId(null);
        },
        hasPanel: (item) => {
          const mod = findModuleByRailTitle(item.title);
          return Boolean(mod && moduleHasPanel(mod));
        },
        navGroups,
        footerNavItems,
        brandNode: (
          <Logo
            variant="full"
            className="h-9 w-auto max-w-full"
          />
        ),
        brandNodeCollapsed: (
          <Logo
            variant="symbol"
            className="h-10 w-10"
          />
        ),
        linkComponent: ComercioLink,
        renderPanelHeader: (item) => (
          <Typography variant="subtitle1" sx={{
            fontWeight: 600
          }}>
            {item.title}
          </Typography>
        ),
        renderPanelContent: (item) => {
          const mod = panelModule ?? findModuleByRailTitle(item.title);
          if (!mod || !moduleHasPanel(mod)) return null;
          return <ComercioPanelMenu module={mod} />;
        },
      }}
    >
      {children}
    </DualDashboardLayout>
  );
}


export function ComercioErpLayout({ children }: { children: ReactNode }) {
  // O provider de organização vive em `app/providers.tsx`, acima do shell:
  // as páginas de seleção de empresa também precisam dele.
  return <ComercioErpShell>{children}</ComercioErpShell>;
}
