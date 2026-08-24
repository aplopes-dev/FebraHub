'use client';

import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import {
  useCallback,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';

/** Altura da faixa de marca — alinhada ao header do shell (~56px). */
const BRAND_ROW_HEIGHT = 56;
/** Tamanho do botão flutuante (modo expandido) na borda sidebar/header. */
const COLLAPSE_BTN_SIZE = 28;
/** Padding horizontal dos itens no modo comprimido. */
const COLLAPSED_ITEM_PX = 1.5;

export type AppSidebarLinkComponent = ComponentType<{
  href: string;
  onClick?: () => void;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}>;

export type AppSidebarNavItem = {
  id: string;
  title: string;
  /** Rota do item. Omitir quando for ação (`onClick`). */
  url?: string;
  icon: ReactNode;
  isActive?: boolean;
  disabled?: boolean;
  /** Ação sem navegação (ex.: logout). */
  onClick?: () => void;
};

export type AppSidebarNavGroup = {
  label: string;
  items: AppSidebarNavItem[];
};

export type AppSidebarProps = {
  navGroups?: AppSidebarNavGroup[];
  navItems?: AppSidebarNavItem[];
  footerNavItems?: AppSidebarNavItem[];
  brandNode?: ReactNode;
  brandNodeCollapsed?: ReactNode;
  /** Conteúdo extra no rodapé (abaixo dos footerNavItems). */
  sidebarFooter?: ReactNode;
  /**
   * Modo colapsável:
   * - `"icon"` — expande/recolhe para só ícones (padrão, como `@citybox/ui` AppSidebar)
   * - `false` — sempre expandido
   */
  collapsible?: 'icon' | false;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  collapseLabel?: string;
  expandLabel?: string;
  linkComponent?: AppSidebarLinkComponent;
  width?: number;
  collapsedWidth?: number;
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
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <a href={href} onClick={onClick} style={style} className={className}>
      {children}
    </a>
  );
}

function resolveGroups(
  navGroups: AppSidebarNavGroup[] | undefined,
  navItems: AppSidebarNavItem[] | undefined,
): AppSidebarNavGroup[] {
  if (navGroups && navGroups.length > 0) return navGroups;
  return [{ label: '', items: navItems ?? [] }];
}

function menuButtonSx(collapsed: boolean) {
  return {
    borderRadius: 1.5,
    minHeight: 44,
    px: collapsed ? 0 : 1.5,
    justifyContent: collapsed ? 'center' : 'flex-start',
    color: 'sidebar.contrastText',
    '&.Mui-selected': {
      bgcolor: (theme: { palette: { primary: { main: string } } }) =>
        alpha(theme.palette.primary.main, 0.12),
      color: (theme: { palette: { mode: string } }) =>
        theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark',
      '& .MuiListItemIcon-root': {
        color: (theme: { palette: { mode: string } }) =>
          theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark',
      },
      '&:hover': {
        bgcolor: (theme: { palette: { primary: { main: string } } }) =>
          alpha(theme.palette.primary.main, 0.16),
      },
    },
    '&.Mui-disabled': { opacity: 0.4 },
  } as const;
}

function menuIconSx(collapsed: boolean) {
  return {
    minWidth: collapsed ? 0 : 40,
    justifyContent: 'center',
    color: 'inherit',
    '& > *': { fontSize: 22, width: 22, height: 22 },
  } as const;
}

export function AppSidebar({
  navGroups,
  navItems,
  footerNavItems = [],
  brandNode,
  brandNodeCollapsed,
  sidebarFooter,
  collapsible = 'icon',
  collapsed: collapsedProp,
  onCollapsedChange,
  collapseLabel = 'Recolher menu',
  expandLabel = 'Expandir menu',
  linkComponent: LinkComponent = DefaultLink,
  width = 256,
  collapsedWidth = 88,
}: AppSidebarProps) {
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(false);
  const collapsed =
    collapsible === false
      ? false
      : (collapsedProp ?? uncontrolledCollapsed);

  const setCollapsed = useCallback(
    (next: boolean) => {
      onCollapsedChange?.(next);
      if (collapsedProp !== undefined) return;
      setUncontrolledCollapsed(next);
    },
    [onCollapsedChange, collapsedProp],
  );

  const groups = resolveGroups(navGroups, navItems);
  const currentWidth = collapsed ? collapsedWidth : width;

  const renderItem = (item: AppSidebarNavItem) => {
    const isActive = Boolean(item.isActive);
    const buttonSx = menuButtonSx(collapsed);

    const icon = (
      <ListItemIcon sx={menuIconSx(collapsed)}>{item.icon}</ListItemIcon>
    );

    const label = !collapsed ? (
      <ListItemText
        primary={item.title}
        slotProps={{ primary: { variant: 'body2', noWrap: true } }}
      />
    ) : null;

    let button: ReactNode;

    if (item.disabled) {
      button = (
        <ListItemButton disabled selected={isActive} sx={buttonSx}>
          {icon}
          {label}
        </ListItemButton>
      );
    } else if (item.onClick && !item.url) {
      button = (
        <ListItemButton
          selected={isActive}
          onClick={item.onClick}
          sx={buttonSx}
        >
          {icon}
          {label}
        </ListItemButton>
      );
    } else {
      button = (
        <ListItemButton
          component={LinkComponent}
          href={item.url ?? '#'}
          selected={isActive}
          onClick={item.onClick}
          sx={buttonSx}
        >
          {icon}
          {label}
        </ListItemButton>
      );
    }

    if (!collapsed) {
      return (
        <Box key={item.id} sx={{ px: 1 }}>
          {button}
        </Box>
      );
    }

    return (
      <Tooltip key={item.id} title={item.title} placement="right" arrow>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            px: COLLAPSED_ITEM_PX,
          }}
        >
          {button}
        </Box>
      </Tooltip>
    );
  };

  const collapsedExpandControl =
    collapsible === 'icon' && collapsed ? (
      <Tooltip title={expandLabel} placement="right" arrow>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            px: COLLAPSED_ITEM_PX,
            mb: 0.5,
          }}
        >
          <ListItemButton
            aria-label={expandLabel}
            aria-expanded={false}
            onClick={() => setCollapsed(false)}
            sx={menuButtonSx(true)}
          >
            <ListItemIcon sx={menuIconSx(true)}>
              <ChevronRight />
            </ListItemIcon>
          </ListItemButton>
        </Box>
      </Tooltip>
    ) : null;

  return (
    <Box
      component="nav"
      aria-label="Navegação principal"
      sx={{
        display: 'flex',
        flexShrink: 0,
        width: currentWidth,
        position: 'relative',
        zIndex: 2,
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        height: '100%',
      }}
    >
      <Paper
        elevation={0}
        square
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          bgcolor: 'sidebar.background',
          color: 'sidebar.contrastText',
          borderRight: 1,
          borderColor: 'sidebar.border',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? COLLAPSED_ITEM_PX : 2,
            minHeight: BRAND_ROW_HEIGHT,
            height: BRAND_ROW_HEIGHT,
            flexShrink: 0,
            borderBottom: 1,
            borderColor: 'sidebar.border',
            '& a': {
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 0,
              width: collapsed ? 'auto' : '100%',
            },
          }}
        >
          <LinkComponent href="/">
            {collapsed
              ? (brandNodeCollapsed ?? brandNode)
              : (brandNode ?? brandNodeCollapsed)}
          </LinkComponent>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pt: 2.5, pb: 0.5, minHeight: 0 }}>
          {collapsedExpandControl}

          {groups.map((group) => (
            <List
              key={group.label || group.items[0]?.id || 'main'}
              dense
              disablePadding
              subheader={
                group.label && !collapsed ? (
                  <ListSubheader
                    disableSticky
                    sx={{
                      px: 2.5,
                      py: 0.5,
                      lineHeight: 1.4,
                      fontSize: '0.6875rem',
                      fontWeight: 400,
                      letterSpacing: '0.04em',
                      color: 'text.disabled',
                      bgcolor: 'transparent',
                    }}
                  >
                    {group.label}
                  </ListSubheader>
                ) : undefined
              }
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                mb: 1.5,
              }}
            >
              {group.items.map((item) => renderItem(item))}
            </List>
          ))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
            pb: 1.5,
            pt: 0.5,
            flexShrink: 0,
          }}
        >
          {footerNavItems.length > 0 ? (
            <List
              dense
              disablePadding
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              {footerNavItems.map((item) => renderItem(item))}
            </List>
          ) : null}

          {sidebarFooter && !collapsed ? (
            <Box sx={{ px: 2, pt: 0.5 }}>{sidebarFooter}</Box>
          ) : null}
        </Box>
      </Paper>

      {collapsible === 'icon' && !collapsed ? (
        <Tooltip title={collapseLabel} placement="right" arrow>
          <Box
            sx={{
              position: 'absolute',
              top: (BRAND_ROW_HEIGHT - COLLAPSE_BTN_SIZE) / 2,
              right: -(COLLAPSE_BTN_SIZE / 2),
              zIndex: 3,
            }}
          >
            <IconButton
              aria-label={collapseLabel}
              aria-expanded
              onClick={() => setCollapsed(true)}
              size="small"
              sx={{
                width: COLLAPSE_BTN_SIZE,
                height: COLLAPSE_BTN_SIZE,
                bgcolor: 'background.paper',
                color: 'text.secondary',
                border: 1,
                borderColor: 'divider',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                  borderColor: 'primary.main',
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Tooltip>
      ) : null}
    </Box>
  );
}
