'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { Drawer } from '@citybox/mui/molecules';
import type { NavItem } from '@/features/shared/data/navigation';
import { Logo } from '@/components/brand/logo';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';

type DashboardMobileNavProps = {
  navItems: readonly NavItem[];
  /** Exibe link Configurações no drawer. */
  showSettings?: boolean;
};

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Menu hamburger + drawer — navegação principal abaixo do breakpoint `lg`
 * (o pill do header some em telas estreitas).
 */
export function DashboardMobileNav({
  navItems,
  showSettings = true,
}: DashboardMobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label="Abrir menu de navegação"
        aria-expanded={open}
        aria-controls="dashboard-mobile-nav"
        onClick={() => setOpen(true)}
        sx={{
          display: { xs: 'inline-flex', lg: 'none' },
          width: { xs: 40, sm: 44 },
          height: { xs: 40, sm: 44 },
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: 0,
          borderRadius: '999px',
          cursor: 'pointer',
          color: 'text.primary',
          bgcolor: 'secondary.main',
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: 'secondary.dark' },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        <MenuIcon sx={{ fontSize: { xs: 22, sm: 24 } }} />
      </Box>

      <Drawer
        id="dashboard-mobile-nav"
        open={open}
        onClose={close}
        anchor="left"
        title={<Logo />}
        width={300}
      >
        <Stack spacing={0.5} component="nav" aria-label="Navegação principal">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Box
                key={item.href}
                component={Link}
                href={item.href}
                onClick={close}
                aria-current={active ? 'page' : undefined}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  px: 1.75,
                  py: 1.5,
                  borderRadius: '14px',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  transition: 'background-color 0.15s, color 0.15s',
                  ...(active
                    ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                      }
                    : {
                        color: 'text.primary',
                        bgcolor: 'transparent',
                        '&:hover': {
                          bgcolor: listifyElevatedSurface(theme),
                        },
                      }),
                })}
              >
                {item.label}
              </Box>
            );
          })}

          {showSettings ? (
            <DrawerFooterLink
              href="/settings"
              label="Configurações"
              icon={<SettingsOutlinedIcon sx={{ fontSize: 20 }} />}
              active={
                pathname === '/settings' || pathname.startsWith('/settings/')
              }
              withDivider
              onClick={close}
            />
          ) : null}
        </Stack>
      </Drawer>
    </>
  );
}

function DrawerFooterLink({
  href,
  label,
  icon,
  active,
  withDivider,
  onClick,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  withDivider: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      component={Link}
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        mt: withDivider ? 1 : 0.25,
        px: 1.75,
        py: 1.5,
        borderRadius: '14px',
        textDecoration: 'none',
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.4,
        ...(withDivider
          ? {
              borderTop: '1px solid',
              borderColor: 'divider',
              pt: 2,
            }
          : {}),
        transition: 'background-color 0.15s, color 0.15s',
        ...(active
          ? {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }
          : {
              color: 'text.primary',
              bgcolor: 'transparent',
              '&:hover': {
                bgcolor: listifyElevatedSurface(theme),
              },
            }),
      })}
    >
      {icon}
      <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
        {label}
      </Typography>
    </Box>
  );
}
