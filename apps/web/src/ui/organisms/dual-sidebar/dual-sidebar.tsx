"use client";

import ArrowBack from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MuiDrawer from "@mui/material/Drawer";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import { alpha, type Theme } from "@mui/material/styles";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Typography } from "../../atoms/typography";

export type DualSidebarLinkComponent = ComponentType<{
  href: string;
  onClick?: () => void;
  children?: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}>;

export type DualSidebarNavItem = {
  id: string;
  title: string;
  url: string;
  icon: ReactNode;
  isActive?: boolean;
};

export type DualSidebarNavGroup = {
  label: string;
  items: DualSidebarNavItem[];
};

export type DualSidebarLayoutMode = "inline" | "rail-only" | "drawer";

export type DualSidebarProps = {
  navGroups?: DualSidebarNavGroup[];
  navItems?: DualSidebarNavItem[];
  footerNavItems?: DualSidebarNavItem[];
  brandNode?: ReactNode;
  brandNodeCollapsed?: ReactNode;
  /** Slot fixo no pé do rail (avatar, atalho…), abaixo dos itens. */
  railFooter?: ReactNode;
  /** Slot fixo no pé do painel (card de plano, aviso…). */
  panelFooter?: ReactNode;
  panelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  hasPanel?: (item: DualSidebarNavItem) => boolean;
  onRailItemSelect?: (item: DualSidebarNavItem) => void;
  linkComponent?: DualSidebarLinkComponent;
  renderPanelHeader?: (activeItem: DualSidebarNavItem) => ReactNode;
  renderPanelContent?: (activeItem: DualSidebarNavItem) => ReactNode;
  /**
   * Mostra o nome do módulo sob o ícone, no rail. Default: `true`.
   *
   * Desligado, o item vira só o ícone e passa a ganhar tooltip — que é então o
   * único nome que ele tem, inclusive para leitor de tela.
   */
  showRailLabels?: boolean;
  /** Como a sidebar se comporta em telas menores. Default: `inline`. */
  layoutMode?: DualSidebarLayoutMode;
  /** Drawer mobile aberto (só em `layoutMode="drawer"`). */
  mobileNavOpen?: boolean;
  onMobileNavClose?: () => void;
  railWidth?: number;
  panelWidth?: number;
};

/** Medidas do design (Figma NodeX — `Type=Sidebar Container`, nó 37041:5385). */
export const DUAL_SIDEBAR_RAIL_WIDTH = 88;
export const DUAL_SIDEBAR_PANEL_WIDTH = 240;
const HEADER_HEIGHT = 64;
/** Caixa do ícone no rail — é ela que recebe o realce de ativo, não o botão. */
const RAIL_ICON_BOX = 32;
const ICON_SIZE = 16;

function DefaultLink({
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
    <a href={href} onClick={onClick} style={style} className={className}>
      {children}
    </a>
  );
}

function flattenNavItems(
  navGroups: DualSidebarNavGroup[] | undefined,
  navItems: DualSidebarNavItem[] | undefined,
): DualSidebarNavItem[] {
  if (navGroups && navGroups.length > 0) {
    return navGroups.flatMap((group) => group.items);
  }
  return navItems ?? [];
}

function resolveActiveItem(
  items: DualSidebarNavItem[],
  footerItems: DualSidebarNavItem[],
): DualSidebarNavItem | undefined {
  const all = [...items, ...footerItems];
  return all.find((item) => item.isActive) ?? items[0] ?? footerItems[0];
}

/** Classe da caixa 32×32 — o hover do botão realça ela, não o botão. */
const RAIL_ICON_BOX_CLASS = "DualSidebar-railIconBox";

const railButtonSx = (isActive: boolean) => ({
  width: "100%",
  minWidth: 0,
  flexDirection: "column",
  gap: 0.5,
  px: 0,
  py: 1,
  borderRadius: 1,
  justifyContent: "center",
  alignItems: "center",
  color: isActive
    ? "sidebar.railActiveContrastText"
    : "sidebar.railContrastText",
  "&:hover, &.Mui-selected, &.Mui-selected:hover": {
    bgcolor: "transparent",
  },
  [`&:hover .${RAIL_ICON_BOX_CLASS}`]: {
    bgcolor: "sidebar.railActive",
    borderColor: "sidebar.railActiveBorder",
    color: "sidebar.railActiveContrastText",
    boxShadow: (theme: Theme) =>
      `0 0 0 2px ${theme.palette.sidebar.railActiveRing}`,
  },
});

function railIconBoxSx(isActive: boolean) {
  return {
    width: RAIL_ICON_BOX,
    height: RAIL_ICON_BOX,
    minWidth: RAIL_ICON_BOX,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 1,
    border: "1px solid transparent",
    color: "inherit",
    ...(isActive
      ? {
          bgcolor: "sidebar.railActive",
          borderColor: "sidebar.railActiveBorder",
          color: "sidebar.railActiveContrastText",
          boxShadow: (theme: Theme) =>
            `0 0 0 2px ${theme.palette.sidebar.railActiveRing}`,
        }
      : null),
  } as const;
}

const railIconSx = {
  minWidth: 0,
  justifyContent: "center",
  color: "inherit",
  "& > *": { fontSize: ICON_SIZE, width: ICON_SIZE, height: ICON_SIZE },
} as const;

const railLabelSx = {
  display: "block",
  alignSelf: "stretch",
  minWidth: 0,
  textAlign: "center",
  fontSize: 12,
  fontStyle: "normal",
  fontWeight: 500,
  lineHeight: "normal",
  letterSpacing: 0,
  color: "inherit",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
} as const;

const panelPaperSx = {
  width: DUAL_SIDEBAR_PANEL_WIDTH,
  flexShrink: 0,
  boxSizing: "border-box",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  bgcolor: "sidebar.background",
  color: "sidebar.contrastText",
  borderRight: 1,
  borderColor: "sidebar.border",
  boxShadow: (theme: Theme) => theme.palette.sidebar.panelShadow,
} as const;

type DualSidebarInternals = {
  groups: DualSidebarNavGroup[];
  footerNavItems: DualSidebarNavItem[];
  activeItem: DualSidebarNavItem | undefined;
  brandNode?: ReactNode;
  brandNodeCollapsed?: ReactNode;
  railFooter?: ReactNode;
  panelFooter?: ReactNode;
  showRailLabels: boolean;
  railWidth: number;
  panelWidth: number;
  panelOpen: boolean;
  renderPanelHeader?: (activeItem: DualSidebarNavItem) => ReactNode;
  renderPanelContent?: (activeItem: DualSidebarNavItem) => ReactNode;
  renderRailButton: (item: DualSidebarNavItem) => ReactNode;
};

function RailColumn({
  groups,
  footerNavItems,
  brandNode,
  brandNodeCollapsed,
  railFooter,
  showRailLabels,
  railWidth,
  renderRailButton,
}: Pick<
  DualSidebarInternals,
  | "groups"
  | "footerNavItems"
  | "brandNode"
  | "brandNodeCollapsed"
  | "railFooter"
  | "showRailLabels"
  | "railWidth"
  | "renderRailButton"
>) {
  return (
    <Paper
      elevation={0}
      square
      sx={{
        width: railWidth,
        flexShrink: 0,
        boxSizing: "border-box",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        pt: 0,
        px: 1.5,
        pb: 1.5,
        bgcolor: "sidebar.rail",
        color: "sidebar.railContrastText",
        borderRight: 1,
        borderColor: "sidebar.railBorder",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          flex: "1 1 auto",
          minWidth: 0,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: HEADER_HEIGHT,
            flexShrink: 0,
            width: "100%",
            borderRadius: 1,
            color: "sidebar.railActiveContrastText",
          }}
        >
          {brandNodeCollapsed ?? brandNode ?? (
            <Typography variant="h6" sx={{ color: "inherit" }}>
              C
            </Typography>
          )}
        </Box>

        {groups.map((group) => (
          <List
            key={group.label || "main"}
            dense
            disablePadding
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              width: "100%",
              minWidth: 0,
            }}
          >
            {group.items.map((item) => renderRailButton(item))}
          </List>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          width: "100%",
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        {footerNavItems.length > 0 ? (
          <List
            dense
            disablePadding
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              width: "100%",
              minWidth: 0,
            }}
          >
            {footerNavItems.map((item) => renderRailButton(item))}
          </List>
        ) : null}
        {railFooter}
      </Box>
    </Paper>
  );
}

function PanelColumn({
  activeItem,
  panelFooter,
  panelWidth,
  renderPanelHeader,
  renderPanelContent,
  paperSx,
}: Pick<
  DualSidebarInternals,
  | "activeItem"
  | "panelFooter"
  | "panelWidth"
  | "renderPanelHeader"
  | "renderPanelContent"
> & {
  paperSx?: Record<string, unknown>;
}) {
  return (
    <Paper elevation={0} square sx={{ ...panelPaperSx, width: panelWidth, ...paperSx }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: HEADER_HEIGHT,
            flexShrink: 0,
            pl: 2,
            pr: 1.5,
            py: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            {activeItem && renderPanelHeader ? (
              renderPanelHeader(activeItem)
            ) : (
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
                {activeItem?.title}
              </Typography>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            px: 1.5,
            pt: 1.5,
            pb: 1,
            minHeight: 0,
          }}
        >
          {activeItem ? renderPanelContent?.(activeItem) : null}
        </Box>
        {panelFooter ? (
          <Box sx={{ px: 1.5, pb: 1.5, flexShrink: 0 }}>{panelFooter}</Box>
        ) : null}
      </Box>
    </Paper>
  );
}

function MobileNavDrawer({
  open,
  onClose,
  internals,
  itemHasPanel,
  onSelectModule,
}: {
  open: boolean;
  onClose: () => void;
  internals: DualSidebarInternals;
  itemHasPanel: (item: DualSidebarNavItem) => boolean;
  onSelectModule: (item: DualSidebarNavItem) => void;
}) {
  const [view, setView] = useState<"modules" | "panel">("modules");

  useEffect(() => {
    if (!open) {
      setView("modules");
    }
  }, [open]);

  const allItems = useMemo(
    () => [
      ...internals.groups.flatMap((group) => group.items),
      ...internals.footerNavItems,
    ],
    [internals.footerNavItems, internals.groups],
  );

  const handleModuleClick = (item: DualSidebarNavItem) => {
    onSelectModule(item);
    if (itemHasPanel(item)) {
      setView("panel");
      return;
    }
    onClose();
  };

  return (
    <MuiDrawer
      open={open}
      onClose={onClose}
      anchor="left"
      slotProps={{
        paper: {
          sx: {
            width: "min(328px, 88vw)",
            maxWidth: "100%",
            bgcolor: "sidebar.background",
            color: "sidebar.contrastText",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {view === "modules" ? (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                height: HEADER_HEIGHT,
                flexShrink: 0,
                px: 2,
                borderBottom: 1,
                borderColor: "sidebar.border",
              }}
            >
              {internals.brandNode ?? internals.brandNodeCollapsed}
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1 }}>
              <List disablePadding>
                {allItems.map((item) => {
                  const isActive =
                    internals.activeItem?.id === item.id || Boolean(item.isActive);
                  return (
                    <ListItemButton
                      key={item.id}
                      selected={isActive}
                      onClick={() => handleModuleClick(item)}
                      sx={{
                        gap: 1.5,
                        px: 2,
                        py: 1.25,
                        color: "sidebar.itemContrastText",
                        "&.Mui-selected": {
                          bgcolor: "sidebar.itemActive",
                          color: "sidebar.itemActiveContrastText",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, color: "inherit" }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        slotProps={{
                          primary: {
                            sx: { fontSize: 14, fontWeight: 500 },
                          },
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                height: HEADER_HEIGHT,
                flexShrink: 0,
                px: 1,
                borderBottom: 1,
                borderColor: "sidebar.border",
              }}
            >
              <IconButton
                aria-label="Voltar para módulos"
                onClick={() => setView("modules")}
                sx={{ color: "inherit" }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                {internals.activeItem && internals.renderPanelHeader
                  ? internals.renderPanelHeader(internals.activeItem)
                  : internals.activeItem?.title}
              </Box>
            </Box>
            <Box
              sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, py: 1.5 }}
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest("a")) {
                  onClose();
                }
              }}
            >
              {internals.activeItem
                ? internals.renderPanelContent?.(internals.activeItem)
                : null}
            </Box>
          </>
        )}
      </Box>
    </MuiDrawer>
  );
}

export function DualSidebar({
  navGroups,
  navItems,
  footerNavItems = [],
  brandNode,
  brandNodeCollapsed,
  railFooter,
  panelFooter,
  panelOpen: panelOpenProp,
  onPanelOpenChange,
  hasPanel,
  onRailItemSelect,
  linkComponent: LinkComponent = DefaultLink,
  renderPanelHeader,
  renderPanelContent,
  showRailLabels: showRailLabelsProp = true,
  layoutMode = "inline",
  mobileNavOpen = false,
  onMobileNavClose,
  railWidth = DUAL_SIDEBAR_RAIL_WIDTH,
  panelWidth = DUAL_SIDEBAR_PANEL_WIDTH,
}: DualSidebarProps) {
  const flatItems = useMemo(
    () => flattenNavItems(navGroups, navItems),
    [navGroups, navItems],
  );

  const groups: DualSidebarNavGroup[] = useMemo(() => {
    if (navGroups && navGroups.length > 0) return navGroups;
    return [{ label: "", items: navItems ?? [] }];
  }, [navGroups, navItems]);

  const [activeItem, setActiveItem] = useState<DualSidebarNavItem | undefined>(
    () => resolveActiveItem(flatItems, footerNavItems),
  );

  useEffect(() => {
    const next = resolveActiveItem(flatItems, footerNavItems);
    if (next) setActiveItem(next);
  }, [flatItems, footerNavItems]);

  const [uncontrolledPanelOpen, setUncontrolledPanelOpen] = useState(false);
  const panelOpen = panelOpenProp ?? uncontrolledPanelOpen;

  const setPanelOpen = useCallback(
    (next: boolean) => {
      onPanelOpenChange?.(next);
      if (panelOpenProp !== undefined) return;
      setUncontrolledPanelOpen(next);
    },
    [onPanelOpenChange, panelOpenProp],
  );

  const itemHasPanel = useCallback(
    (item: DualSidebarNavItem) => (hasPanel ? hasPanel(item) : false),
    [hasPanel],
  );

  const handleSelect = useCallback(
    (item: DualSidebarNavItem) => {
      setActiveItem(item);
      setPanelOpen(itemHasPanel(item));
      onRailItemSelect?.(item);
    },
    [itemHasPanel, onRailItemSelect, setPanelOpen],
  );

  const showRailLabels =
    layoutMode === "rail-only" ? false : showRailLabelsProp;

  const renderRailButton = (item: DualSidebarNavItem) => {
    const isActive = activeItem?.id === item.id || Boolean(item.isActive);
    const openPanelOnly = itemHasPanel(item);

    const content = (
      <>
        <ListItemIcon
          className={RAIL_ICON_BOX_CLASS}
          sx={railIconBoxSx(isActive)}
        >
          <Box sx={railIconSx}>{item.icon}</Box>
        </ListItemIcon>
        {showRailLabels ? (
          <Typography component="span" sx={railLabelSx}>
            {item.title}
          </Typography>
        ) : null}
      </>
    );

    const button = openPanelOnly ? (
      <ListItemButton
        selected={isActive}
        onClick={() => handleSelect(item)}
        sx={railButtonSx(isActive)}
      >
        {content}
      </ListItemButton>
    ) : (
      <ListItemButton
        selected={isActive}
        component={LinkComponent}
        href={item.url}
        onClick={() => {
          handleSelect(item);
          onMobileNavClose?.();
        }}
        sx={railButtonSx(isActive)}
      >
        {content}
      </ListItemButton>
    );

    const wrapped = (
      <Box
        key={item.id}
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          minWidth: 0,
        }}
      >
        {button}
      </Box>
    );

    if (showRailLabels) return wrapped;

    return (
      <Tooltip key={item.id} title={item.title} placement="right" arrow>
        {wrapped}
      </Tooltip>
    );
  };

  const isOverlayPanel = layoutMode === "rail-only" && panelOpen;
  const inlinePanel = layoutMode === "inline" && panelOpen;
  const totalWidth =
    layoutMode === "drawer"
      ? 0
      : railWidth + (inlinePanel ? panelWidth : 0);

  useEffect(() => {
    if (!isOverlayPanel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanelOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOverlayPanel, setPanelOpen]);

  const internals: DualSidebarInternals = {
    groups,
    footerNavItems,
    activeItem,
    brandNode,
    brandNodeCollapsed,
    railFooter,
    panelFooter,
    showRailLabels,
    railWidth,
    panelWidth,
    panelOpen,
    renderPanelHeader,
    renderPanelContent,
    renderRailButton,
  };

  if (layoutMode === "drawer") {
    return (
      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={() => onMobileNavClose?.()}
        internals={internals}
        itemHasPanel={itemHasPanel}
        onSelectModule={handleSelect}
      />
    );
  }

  return (
    <>
      <Box
        component="nav"
        aria-label="Navegação principal"
        sx={{
          display: "flex",
          flexShrink: 0,
          width: totalWidth,
          boxSizing: "border-box",
          position: "relative",
          zIndex: 2,
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          height: "100%",
          borderRight: 0,
          bgcolor: "transparent",
          fontFamily: "var(--font-manrope, inherit)",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        <RailColumn
          groups={groups}
          footerNavItems={footerNavItems}
          brandNode={brandNode}
          brandNodeCollapsed={brandNodeCollapsed}
          railFooter={railFooter}
          showRailLabels={showRailLabels}
          railWidth={railWidth}
          renderRailButton={renderRailButton}
        />
        {inlinePanel ? (
          <PanelColumn
            activeItem={activeItem}
            panelFooter={panelFooter}
            panelWidth={panelWidth}
            renderPanelHeader={renderPanelHeader}
            renderPanelContent={renderPanelContent}
          />
        ) : null}
      </Box>

      {isOverlayPanel ? (
        <>
          <Box
            component="button"
            type="button"
            aria-label="Fechar menu"
            onClick={() => setPanelOpen(false)}
            sx={{
              position: "fixed",
              top: 0,
              left: railWidth,
              right: 0,
              bottom: 0,
              zIndex: 3,
              border: 0,
              p: 0,
              cursor: "pointer",
              bgcolor: (theme) => alpha(theme.palette.common.black, 0.4),
            }}
          />
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: railWidth,
              bottom: 0,
              zIndex: 4,
              width: `min(${panelWidth}px, 88vw)`,
            }}
          >
            <PanelColumn
              activeItem={activeItem}
              panelFooter={panelFooter}
              panelWidth={panelWidth}
              renderPanelHeader={renderPanelHeader}
              renderPanelContent={renderPanelContent}
              paperSx={{ width: "100%", height: "100%" }}
            />
          </Box>
        </>
      ) : null}
    </>
  );
}
