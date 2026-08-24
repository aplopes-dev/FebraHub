'use client';

import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined';
import Logout from '@mui/icons-material/Logout';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { IconButton, NavUser, toast } from '@citybox/mui';
import { useSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';
import { firstAllowedSettingsPath } from '@/lib/beautiful-nav-permissions';
import { CommandSearch } from '@/shell/command-search';
import { NotificationsMenu } from '@/shell/notifications-menu';
import { ThemeModeSwitch } from '@/shell/theme-mode-switch';
import { UnitSwitcher } from '@/shell/unit-switcher';

function ProfileMenuIcon() {
  return <PersonOutlined sx={{ fontSize: 16 }} />;
}

function LogoutMenuIcon() {
  return <Logout sx={{ fontSize: 16 }} />;
}

export function BeautifulHeader() {
  const { session, logout } = useSession();
  const { storeId, stores } = useStore();
  const active = stores.find((s) => s.id === storeId);
  const settingsHref =
    firstAllowedSettingsPath(
      active?.permissions ?? [],
      active?.isOrganizationOwner === true,
    ) ?? '/configuracoes';
  const headerUser = {
    name: session?.user.name ?? 'Usuário',
    email: session?.user.email ?? '',
    avatar: '',
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        alignItems: 'center',
        columnGap: 1.5,
        width: '100%',
        minHeight: 56,
        px: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          justifySelf: 'start',
          flexShrink: 0,
        }}
      >
        <UnitSwitcher />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          minWidth: 0,
          px: 1,
        }}
      >
        <CommandSearch />
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          flexShrink: 0,
          alignItems: 'center',
          justifySelf: 'end',
        }}
      >
        <ThemeModeSwitch />
        <IconButton
          size="small"
          aria-label="Ajuda"
          onClick={() =>
            toast.message('Central de ajuda em breve', {
              description: 'Conteúdo de suporte será adicionado depois.',
            })
          }
          sx={{ width: 36, height: 36 }}
        >
          <HelpOutlineOutlined sx={{ fontSize: 16 }} />
        </IconButton>
        <NotificationsMenu />
        <NavUser
          variant="header"
          user={headerUser}
          linkComponent={Link}
          menuGroups={[
            {
              items: [
                {
                  label: 'Editar perfil',
                  href: settingsHref,
                  icon: ProfileMenuIcon,
                },
                {
                  label: 'Sair',
                  icon: LogoutMenuIcon,
                  onSelect: () => {
                    void logout();
                  },
                },
              ],
            },
          ]}
        />
      </Stack>
    </Box>
  );
}
