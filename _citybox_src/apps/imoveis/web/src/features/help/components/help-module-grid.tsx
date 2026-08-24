'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { StatIconBadge } from '@/components/ui/stat-icon-badge';
import type { HelpModule, HelpModuleId } from '../data/help-content';

const MODULE_ICONS: Record<HelpModuleId, ComponentType<SvgIconProps>> = {
  dashboard: SpaceDashboardOutlinedIcon,
  leads: PeopleOutlinedIcon,
  properties: HomeOutlinedIcon,
  transactions: RequestQuoteOutlinedIcon,
  finance: AccountBalanceWalletOutlinedIcon,
  calendar: CalendarMonthOutlinedIcon,
  settings: SettingsOutlinedIcon,
  catalog: StorefrontOutlinedIcon,
};

type HelpModuleGridProps = {
  modules: readonly HelpModule[];
};

export function HelpModuleGrid({ modules }: HelpModuleGridProps) {
  if (modules.length === 0) return null;

  return (
    <Box>
      <Typography
        component="h2"
        sx={{
          fontSize: '1.125rem',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          mb: 1.5,
        }}
      >
        Módulos do sistema
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {modules.map((module) => {
          const Icon = MODULE_ICONS[module.id];
          return (
            <Panel
              key={module.id}
              sx={{ p: 2, height: '100%' }}
            >
              <Box
                component={Link}
                href={module.href}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                  height: '100%',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <StatIconBadge icon={Icon} size="sm" />
                  <Typography sx={{ fontWeight: 600, fontSize: '1rem', flex: 1 }}>
                    {module.title}
                  </Typography>
                  <ChevronRightIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </Stack>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    lineHeight: 1.55,
                    color: 'text.secondary',
                  }}
                >
                  {module.description}
                </Typography>
              </Box>
            </Panel>
          );
        })}
      </Box>
    </Box>
  );
}
