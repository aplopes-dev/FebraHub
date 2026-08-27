"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrandMark,
  DualDashboardLayout,
  Typography,
  type DualSidebarLayoutMode,
  type DualSidebarNavGroup,
  type DualSidebarNavItem,
} from "@/ui";
import { NavIcon } from "@/lib/nav-icons";
import {
  FOOTER_NAV_MODULES,
  NAV_SECTIONS,
  findModuleById,
  findModuleByPath,
  moduleHasPanel,
  type NavModule,
} from "@/lib/navigation";
import { NavPanelMenu } from "@/shell/nav-panel-menu";
import { AppHeader } from "@/shell/app-header";
import { APP_NAME } from "@/shell/app-name";
import {
  ShellLayoutProvider,
  useShellLayout,
} from "@/shell/shell-layout-context";
import type { ShellLayoutMode } from "@/shell/layout-breakpoints";

function toSidebarLayoutMode(mode: ShellLayoutMode): DualSidebarLayoutMode {
  switch (mode) {
    case "desktop":
      return "inline";
    case "tablet":
      return "rail-only";
    case "mobile":
      return "drawer";
  }
}

function toRailItem(
  module: NavModule,
  highlightModuleId: string | undefined,
): DualSidebarNavItem {
  return {
    id: module.id,
    title: module.label,
    url: module.path,
    icon: <NavIcon name={module.icon} size={16} />,
    isActive: module.id === highlightModuleId,
  };
}

function buildNavGroups(
  highlightModuleId: string | undefined,
): DualSidebarNavGroup[] {
  return NAV_SECTIONS.map((section) => ({
    label: section.label,
    items: section.modules.map((mod) => toRailItem(mod, highlightModuleId)),
  }));
}

function buildFooterItems(
  highlightModuleId: string | undefined,
): DualSidebarNavItem[] {
  return FOOTER_NAV_MODULES.map((mod) => toRailItem(mod, highlightModuleId));
}

/** Ponte para o `linkComponent` do DS, que espera um componente de link cru. */
function NavLinkAdapter({
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

function DualAppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mode, mobileNavOpen, closeMobileNav } = useShellLayout();
  const routeModule = findModuleByPath(pathname);

  const [panelOpen, setPanelOpen] = useState(() =>
    Boolean(routeModule && moduleHasPanel(routeModule)),
  );
  const [panelModuleId, setPanelModuleId] = useState<string | null>(() =>
    routeModule && moduleHasPanel(routeModule) ? routeModule.id : null,
  );

  useEffect(() => {
    if (!routeModule) return;
    if (moduleHasPanel(routeModule)) {
      setPanelModuleId(routeModule.id);
      setPanelOpen(true);
      return;
    }
    setPanelOpen(false);
    setPanelModuleId(null);
  }, [pathname, routeModule]);

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  const highlightModuleId =
    panelOpen && panelModuleId ? panelModuleId : routeModule?.id;

  const panelModule =
    panelModuleId != null ? findModuleById(panelModuleId) : undefined;

  return (
    <DualDashboardLayout
      shellMode={mode}
      header={<AppHeader />}
      mainSx={{
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
      sidebar={{
        layoutMode: toSidebarLayoutMode(mode),
        mobileNavOpen,
        onMobileNavClose: closeMobileNav,
        panelOpen,
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
          const mod = findModuleById(item.id);
          if (mod && moduleHasPanel(mod)) {
            setPanelModuleId(mod.id);
            setPanelOpen(true);
            return;
          }
          setPanelOpen(false);
          setPanelModuleId(null);
        },
        hasPanel: (item) => {
          const mod = findModuleById(item.id);
          return Boolean(mod && moduleHasPanel(mod));
        },
        navGroups: buildNavGroups(highlightModuleId),
        footerNavItems: buildFooterItems(highlightModuleId),
        brandNode: <BrandMark title={APP_NAME} />,
        brandNodeCollapsed: <BrandMark title={APP_NAME} />,
        linkComponent: NavLinkAdapter,
        renderPanelHeader: (item) => (
          <Typography
            component="span"
            sx={{
              fontSize: 20,
              lineHeight: "28px",
              fontWeight: 600,
              color: "inherit",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.title}
          </Typography>
        ),
        renderPanelContent: (item) => {
          const mod = panelModule ?? findModuleById(item.id);
          if (!mod || !moduleHasPanel(mod)) return null;
          return <NavPanelMenu module={mod} />;
        },
      }}
    >
      {children}
    </DualDashboardLayout>
  );
}

/**
 * Casca do app: sidebar dupla (rail de módulos + painel de submenus) e header
 * dentro do container inset.
 */
export function DualAppShell({ children }: { children: ReactNode }) {
  return (
    <ShellLayoutProvider>
      <DualAppShellInner>{children}</DualAppShellInner>
    </ShellLayoutProvider>
  );
}
