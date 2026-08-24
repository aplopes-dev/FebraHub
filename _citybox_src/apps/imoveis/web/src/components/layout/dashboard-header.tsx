'use client';

import type { MouseEvent, ReactNode } from 'react';
import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { Box, Paper, Stack } from '@citybox/mui/atoms';
import { Logo } from '@/components/brand/logo';
import { UserMenu, type CurrentUser } from '@/components/layout/user-menu';
import { DashboardMobileNav } from '@/components/layout/dashboard-mobile-nav';
import { HeaderRemindersPopover } from '@/components/layout/header-reminders-popover';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import { formatHeaderDisplayName } from '@/features/settings/services/settings-service';
import { USER_ROLE_LABEL, type UserRole } from '@/features/settings/types';
import { useSessionPermissions } from '@/features/settings/hooks/use-session-permissions';
import { useAgentProfileQuery } from '@/features/settings/hooks/use-settings-queries';
import { useAuthBlobUrl } from '@/features/settings/hooks/use-auth-blob-url';
import { useAuthSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';
import { DASHBOARD_NAV } from '@/features/shared/data/navigation';
import { GlobalSearchDialog } from '@/features/search/components/global-search-dialog';
import { useGlobalSearchDialog } from '@/features/search/hooks/use-global-search';

const FALLBACK_AGENT: CurrentUser = {
  id: 'pending',
  name: '…',
  role: '',
  initials: '—',
  email: '',
};

function isUserRole(value: string | undefined): value is UserRole {
  return (
    value === 'admin' ||
    value === 'broker' ||
    value === 'affiliated' ||
    value === 'assistant'
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

/** Header do painel — layout Figma Listify topbar (nomes em português). */
export function DashboardHeader() {
  const pathname = usePathname();
  const { session: authSession, status: authStatus } = useAuthSession();
  const { storeId, accessibleStores } = useStore();
  const agentId = useCurrentAgentId();
  const { data: profile, dataUpdatedAt } = useAgentProfileQuery(
    agentId || undefined,
    Boolean(storeId) && Boolean(agentId),
  );
  const photoSrc = useAuthBlobUrl(profile?.photoUrl, dataUpdatedAt);

  const activeStore = useMemo(
    () => accessibleStores.find((s) => s.id === storeId),
    [accessibleStores, storeId],
  );

  const { canNav, canAnySettings } = useSessionPermissions();

  const navItems = useMemo(
    () => DASHBOARD_NAV.filter((item) => canNav(item.href)),
    [canNav],
  );

  const search = useGlobalSearchDialog(navItems);

  const currentUser = useMemo((): CurrentUser => {
    const storeRoleLabel = isUserRole(activeStore?.role)
      ? USER_ROLE_LABEL[activeStore.role]
      : '';

    // Nome e dados de contato: Meu perfil (GET /settings/profile/:agentId).
    if (profile?.name?.trim()) {
      return {
        id: agentId || profile.id,
        name: formatHeaderDisplayName(profile.name),
        role: storeRoleLabel || profile.role || '',
        initials: profile.initials || initialsFromName(profile.name),
        email: profile.email,
        photoUrl: photoSrc,
      };
    }

    // Enquanto o perfil carrega: Keycloak (nome só como fallback).
    if (authStatus === 'authenticated' && authSession?.user) {
      const name = authSession.user.name?.trim() || 'Usuário';
      return {
        id: agentId || authSession.user.username || authSession.user.email || 'sso-user',
        name: formatHeaderDisplayName(name),
        role: storeRoleLabel,
        initials: initialsFromName(name),
        email: authSession.user.email ?? '',
        photoUrl: photoSrc,
      };
    }

    if (profile) {
      return {
        id: agentId || profile.id,
        name: formatHeaderDisplayName(profile.name || '…'),
        role: storeRoleLabel || profile.role || '',
        initials: profile.initials || initialsFromName(profile.name),
        email: profile.email,
        photoUrl: photoSrc,
      };
    }

    return FALLBACK_AGENT;
  }, [activeStore?.role, agentId, authSession, authStatus, photoSrc, profile]);

  return (
    <Paper
      component="header"
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: { xs: 1, sm: 1.5, md: 2 },
        borderRadius: { xs: '16px', sm: '20px' },
        border: 'none',
        px: { xs: 1.25, sm: 2, md: 2.5 },
        py: { xs: 1, sm: 1.25, md: 1.5 },
        bgcolor: 'background.paper',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 0.75, sm: 1.25 }}
        sx={{ alignItems: 'center', minWidth: 0, flexShrink: 1 }}
      >
        <DashboardMobileNav
          navItems={navItems}
          showSettings={canAnySettings()}
        />
        <Box
          component={Link}
          href="/"
          aria-label="Imóveis — início"
          sx={{
            flexShrink: 1,
            minWidth: 0,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Logo />
        </Box>
      </Stack>

      <Box
        component="nav"
        aria-label="Navegação principal"
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexShrink: 1,
          minWidth: 0,
        }}
      >
        <Stack
          component="ul"
          direction="row"
          spacing={0.5}
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0.5,
            alignItems: 'center',
            borderRadius: '20px',
            bgcolor: 'secondary.main',
          }}
        >
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Box component="li" key={item.href} sx={{ flexShrink: 0 }}>
                <Box
                  component={Link}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    px: 3,
                    py: 1.75,
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.15s, color 0.15s',
                    ...(isActive
                      ? {
                          borderRadius: '20px',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                        }
                      : {
                          borderRadius: '12px',
                          color: 'text.primary',
                          bgcolor: 'transparent',
                          '&:hover': { bgcolor: 'secondary.dark' },
                        }),
                  }}
                >
                  {item.label}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Stack
        direction="row"
        spacing={{ xs: 0.5, sm: 1, md: 1.25 }}
        sx={{ alignItems: 'center', flexShrink: 0 }}
      >
        <HeaderIconButton
          label="Buscar"
          onClick={() => search.setOpen(true)}
        >
          <SearchIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
        </HeaderIconButton>

        <HeaderRemindersPopover>
          {({ onClick, badge }) => (
            <HeaderIconButton
              label={
                badge > 0
                  ? `Notificações (${badge} lembretes)`
                  : 'Notificações'
              }
              badge={badge > 0 ? badge : undefined}
              onClick={onClick}
            >
              <NotificationsNoneIcon sx={{ fontSize: { xs: 20, sm: 22, md: 24 } }} />
            </HeaderIconButton>
          )}
        </HeaderRemindersPopover>

        <UserMenu user={currentUser} />
      </Stack>

      <GlobalSearchDialog
        open={search.open}
        onOpenChange={search.onOpenChange}
        query={search.query}
        onQueryChange={search.setQuery}
        result={search.result}
        isLoading={search.isLoading}
      />
    </Paper>
  );
}

type HeaderIconButtonProps = {
  label: string;
  children: ReactNode;
  badge?: number;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

function HeaderIconButton({
  label,
  children,
  badge,
  onClick,
}: HeaderIconButtonProps) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={label}
      onClick={onClick}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        width: { xs: 40, sm: 44, md: 56 },
        height: { xs: 40, sm: 44, md: 56 },
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: 0,
        borderRadius: '999px',
        cursor: 'pointer',
        color: 'text.primary',
        bgcolor: 'secondary.main',
        transition: 'filter 0.15s, background-color 0.15s',
        '&:hover': { bgcolor: 'secondary.dark' },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      {children}
      {badge != null && badge > 0 ? (
        <HeaderIconBadge value={badge} />
      ) : null}
    </Box>
  );
}

function HeaderIconBadge({ value }: { value: number }) {
  return (
    <Box
      component="span"
      sx={{
        position: 'absolute',
        top: { xs: -2, md: 0 },
        right: { xs: -4, md: -2 },
        display: 'inline-flex',
        minWidth: { xs: 16, md: 20 },
        height: { xs: 16, md: 20 },
        alignItems: 'center',
        justifyContent: 'center',
        px: 0.5,
        borderRadius: '999px',
        bgcolor: 'error.main',
        color: '#fff',
        fontSize: { xs: '0.625rem', md: '0.75rem' },
        fontWeight: 500,
        lineHeight: 1.55,
      }}
    >
      {value > 99 ? '99+' : value}
    </Box>
  );
}
