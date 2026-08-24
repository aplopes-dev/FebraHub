'use client';

import { useRef } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Button, Stack } from '@citybox/mui/atoms';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { useHorizontalScrollOverflow } from '../hooks/use-horizontal-scroll-overflow';
import { useSessionPermissions } from '../hooks/use-session-permissions';
import {
  SETTINGS_SECTION_LABEL,
  type SettingsSection,
} from '../types';
import { SettingsMobileScrollHints } from './settings-mobile-scroll-hints';

/**
 * Larguras do menu lateral (sm+). Em `xs` a nav rola na horizontal.
 * Valores usados no `gridTemplateColumns` da page em sm+.
 */
export const SETTINGS_SIDEBAR_WIDTH = {
  sm: 180,
  md: 220,
  xl: 260,
} as const;

/** @deprecated Preferir breakpoints do grid da page; mantido por imports legados. */
export const SETTINGS_SIDEBAR_WIDTH_PX = SETTINGS_SIDEBAR_WIDTH.xl;

const MAIN_SECTIONS: readonly SettingsSection[] = [
  'profile',
  'privacy',
  'notifications',
  'users',
  'system',
  'billing',
];

type SettingsSidebarProps = {
  active: SettingsSection;
  onChange: (section: SettingsSection) => void;
};

const navItemSx = (selected: boolean): SxProps<Theme> => (theme) => ({
  justifyContent: 'flex-start',
  width: { xs: 'auto', sm: '100%' },
  flexShrink: 0,
  px: { xs: 1.5, sm: 1.5, md: 2 },
  py: { xs: 1, sm: 1.5 },
  borderRadius: { xs: '999px', sm: '16px' },
  textTransform: 'none',
  fontSize: { xs: '0.8125rem', sm: '0.8125rem', md: '0.875rem' },
  fontWeight: 500,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
  textAlign: { xs: 'center', sm: 'left' },
  color: selected ? 'text.primary' : 'text.secondary',
  bgcolor: selected ? listifyElevatedSurface(theme) : 'transparent',
  boxShadow: 'none',
  '&:hover': {
    bgcolor: selected
      ? listifyElevatedSurface(theme)
      : theme.palette.mode === 'dark'
        ? 'secondary.dark'
        : 'secondary.main',
    color: 'text.primary',
    boxShadow: 'none',
  },
});

export function SettingsSidebar({ active, onChange }: SettingsSidebarProps) {
  const { canSettings } = useSessionPermissions();
  const scrollerRef = useRef<HTMLUListElement | null>(null);

  const visibleSections = MAIN_SECTIONS.filter((section) => canSettings(section));
  const showDeleteAccount = canSettings('delete-account');
  const { canScrollStart, canScrollEnd, scrollMore } = useHorizontalScrollOverflow(
    scrollerRef,
    `${visibleSections.join(',')}:${showDeleteAccount ? 1 : 0}`,
  );

  return (
    <Box
      component="nav"
      aria-label="Seções de configurações"
      sx={(theme) => ({
        display: 'flex',
        flexDirection: { xs: 'row', sm: 'column' },
        boxSizing: 'border-box',
        width: '100%',
        height: 'auto',
        minWidth: 0,
        flexShrink: 0,
        gap: { xs: 0.5, sm: 0.5 },
        borderRadius: { xs: '16px', md: '32px' },
        border: '1px solid',
        borderColor:
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'divider',
        bgcolor: 'background.paper',
        p: { xs: 1, sm: 1.25, md: 1.5 },
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
        // sm+: sticky sob o header enquanto a página rola.
        position: { xs: 'relative', sm: 'sticky' },
        top: { sm: 0 },
        alignSelf: { sm: 'start' },
        overflow: 'hidden',
      })}
    >
      <Stack
        ref={scrollerRef}
        component="ul"
        direction={{ xs: 'row', sm: 'column' }}
        spacing={{ xs: 0.5, sm: 0.25 }}
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          minWidth: 0,
          flex: 1,
          width: '100%',
          // Só chips horizontais no mobile; sem scroll vertical interno.
          overflowX: { xs: 'auto', sm: 'visible' },
          overflowY: 'visible',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {visibleSections.map((section) => (
          <Box component="li" key={section} sx={{ flexShrink: 0 }}>
            <Button
              type="button"
              onClick={() => onChange(section)}
              disableRipple
              sx={navItemSx(active === section)}
            >
              {SETTINGS_SECTION_LABEL[section]}
            </Button>
          </Box>
        ))}
        {showDeleteAccount ? (
          <Box
            component="li"
            sx={{
              flexShrink: 0,
              display: { xs: 'list-item', sm: 'none' },
            }}
          >
            <Button
              type="button"
              onClick={() => onChange('delete-account')}
              disableRipple
              sx={{
                justifyContent: 'center',
                width: 'auto',
                flexShrink: 0,
                px: 1.5,
                py: 1,
                borderRadius: '999px',
                textTransform: 'none',
                fontSize: '0.8125rem',
                fontWeight: 500,
                lineHeight: 1.4,
                whiteSpace: 'nowrap',
                color: 'error.main',
                bgcolor: active === 'delete-account' ? 'error.light' : 'transparent',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: 'error.light',
                  boxShadow: 'none',
                },
              }}
            >
              {SETTINGS_SECTION_LABEL['delete-account']}
            </Button>
          </Box>
        ) : null}
      </Stack>

      <SettingsMobileScrollHints
        canScrollStart={canScrollStart}
        canScrollEnd={canScrollEnd}
        onScrollStart={() => scrollMore(-1)}
        onScrollEnd={() => scrollMore(1)}
      />

      {showDeleteAccount ? (
        <Box
          sx={{
            mt: 1,
            flexShrink: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 1,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Button
            type="button"
            onClick={() => onChange('delete-account')}
            disableRipple
            sx={{
              justifyContent: 'flex-start',
              width: '100%',
              px: { sm: 1.5, md: 2 },
              py: 1.5,
              borderRadius: '16px',
              textTransform: 'none',
              fontSize: { sm: '0.8125rem', md: '0.875rem' },
              fontWeight: 500,
              lineHeight: 1.4,
              whiteSpace: 'normal',
              textAlign: 'left',
              color: 'error.main',
              bgcolor: active === 'delete-account' ? 'error.light' : 'transparent',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: 'error.light',
                boxShadow: 'none',
              },
            }}
          >
            {SETTINGS_SECTION_LABEL['delete-account']}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
