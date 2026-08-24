"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import PanelLeftCloseIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import PanelLeftOpenIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ElementType,
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

export type DualSidebarProps = {
  navGroups?: DualSidebarNavGroup[];
  navItems?: DualSidebarNavItem[];
  footerNavItems?: DualSidebarNavItem[];
  brandNode?: ReactNode;
  brandNodeCollapsed?: ReactNode;
  panelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  hasPanel?: (item: DualSidebarNavItem) => boolean;
  onRailItemSelect?: (item: DualSidebarNavItem) => void;
  panelCloseLabel?: string;
  panelOpenLabel?: string;
  panelCloseIcon?: ElementType;
  panelOpenIcon?: ElementType;
  linkComponent?: DualSidebarLinkComponent;
  renderPanelHeader?: (activeItem: DualSidebarNavItem) => ReactNode;
  renderPanelContent?: (activeItem: DualSidebarNavItem) => ReactNode;
  railWidth?: number;
  panelWidth?: number;
};

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

const railButtonSx = {
  width: 44,
  height: 44,
  minWidth: 44,
  borderRadius: 1.5,
  justifyContent: "center",
  px: 0,
  color: "primary.contrastText",
  "&:hover": {
    bgcolor: (theme: { palette: { common: { white: string } } }) =>
      alpha(theme.palette.common.white, 0.12),
  },
  "&.Mui-selected": {
    bgcolor: (theme: { palette: { common: { white: string } } }) =>
      alpha(theme.palette.common.white, 0.2),
    color: "primary.contrastText",
    "&:hover": {
      bgcolor: (theme: { palette: { common: { white: string } } }) =>
        alpha(theme.palette.common.white, 0.24),
    },
    "& .MuiListItemIcon-root": { color: "primary.contrastText" },
  },
} as const;

const railIconSx = {
  minWidth: 0,
  justifyContent: "center",
  color: "inherit",
  /** Densidade do rail — 18px. */
  "& > *": { fontSize: 18, width: 18, height: 18 },
} as const;

export function DualSidebar({
  navGroups,
  navItems,
  footerNavItems = [],
  brandNode,
  brandNodeCollapsed,
  panelOpen: panelOpenProp,
  onPanelOpenChange,
  hasPanel,
  onRailItemSelect,
  panelCloseLabel = "Fechar menu",
  panelOpenLabel = "Abrir menu",
  panelCloseIcon: PanelCloseIcon = PanelLeftCloseIcon,
  panelOpenIcon: PanelOpenIcon = PanelLeftOpenIcon,
  linkComponent: LinkComponent = DefaultLink,
  renderPanelHeader,
  renderPanelContent,
  railWidth = 72,
  panelWidth = 240,
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
    [itemHasPanel, setPanelOpen, onRailItemSelect],
  );

  const renderRailButton = (item: DualSidebarNavItem) => {
    const isActive = activeItem?.id === item.id || Boolean(item.isActive);
    const openPanelOnly = itemHasPanel(item);

    const icon = <ListItemIcon sx={railIconSx}>{item.icon}</ListItemIcon>;

    const button = openPanelOnly ? (
      <ListItemButton
        selected={isActive}
        onClick={() => handleSelect(item)}
        sx={railButtonSx}
      >
        {icon}
      </ListItemButton>
    ) : (
      <ListItemButton
        selected={isActive}
        component={LinkComponent}
        href={item.url}
        onClick={() => handleSelect(item)}
        sx={railButtonSx}
      >
        {icon}
      </ListItemButton>
    );

    return (
      <Tooltip key={item.id} title={item.title} placement="right" arrow>
        <Box sx={{ display: "flex", justifyContent: "center" }}>{button}</Box>
      </Tooltip>
    );
  };

  const totalWidth = railWidth + (panelOpen ? panelWidth : 0);

  return (
    <Box
      component="nav"
      aria-label="Navegação principal"
      sx={{
        display: "flex",
        flexShrink: 0,
        width: totalWidth,
        position: "relative",
        // Acima do header/main para a sombra da col. 2 aparecer sobre o conteúdo.
        zIndex: 2,
        transition: (theme) =>
          theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        height: "100%",
        borderRight: 0,
        bgcolor: "transparent",
      }}
    >
      <Paper
        elevation={0}
        square
        sx={{
          width: railWidth,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          height: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 2,
            minHeight: 64,
            // Fundo do logo herda `currentColor` → primary.light (contraste
            // com o rail primary.main). Paths internos do Logo já são brancos.
            color: "primary.dark",
          }}
        >
          {brandNodeCollapsed ?? brandNode ?? (
            <Typography variant="h6" sx={{ color: "primary.contrastText" }}>
              C
            </Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: "auto", py: 0.5 }}>
          {groups.map((group) => (
            <List
              key={group.label || "main"}
              dense
              disablePadding
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
                mb: 1.5,
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
            gap: 0.75,
            pb: 1.5,
            px: 0.5,
          }}
        >
          <Tooltip
            title={panelOpen ? panelCloseLabel : panelOpenLabel}
            placement="right"
            arrow
          >
            <IconButton
              aria-label={panelOpen ? panelCloseLabel : panelOpenLabel}
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen(!panelOpen)}
              size="medium"
              sx={{
                width: 44,
                height: 44,
                color: "primary.contrastText",
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.common.white, 0.12),
                },
              }}
            >
              {panelOpen ? <PanelCloseIcon /> : <PanelOpenIcon />}
            </IconButton>
          </Tooltip>

          {footerNavItems.length > 0 ? (
            <List
              dense
              disablePadding
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              {footerNavItems.map((item) => renderRailButton(item))}
            </List>
          ) : null}
        </Box>
      </Paper>
      {panelOpen ? (
        <Paper
          elevation={0}
          square
          sx={{
            width: panelWidth,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            // Sem overflow aqui — `overflow: hidden` corta o box-shadow.
            bgcolor: "sidebar.background",
            color: "sidebar.contrastText",
            borderRight: 1,
            borderColor: "sidebar.border",
            boxShadow: (theme) => theme.palette.sidebar.panelShadow,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 2, py: 2, flexShrink: 0 }}>
              {activeItem && renderPanelHeader ? (
                renderPanelHeader(activeItem)
              ) : (
                <Typography variant="subtitle1" sx={{
                  fontWeight: 600
                }}>
                  {activeItem?.title}
                </Typography>
              )}
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1, minHeight: 0 }}>
              {activeItem ? renderPanelContent?.(activeItem) : null}
            </Box>
          </Box>
        </Paper>
      ) : null}
    </Box>
  );
}
