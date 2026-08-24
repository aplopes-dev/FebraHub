'use client';

import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';

export type LeadFormTabValue = 'contact' | 'properties' | 'documents' | 'activity';

const TABS: ReadonlyArray<{
  value: LeadFormTabValue;
  label: string;
  shortLabel?: string;
}> = [
  { value: 'contact', label: 'Informações', shortLabel: 'Dados' },
  { value: 'properties', label: 'Imóveis' },
  { value: 'documents', label: 'Documentos', shortLabel: 'Arquivos' },
  { value: 'activity', label: 'Atividade' },
];
type LeadFormTabsProps = {
  value: string;
  onChange: (value: LeadFormTabValue) => void;
};

/**
 * Navbar de abas Listify (Figma 18166:12722):
 * container branco radius 12, indicador curto warning/50 centralizado sob o ativo.
 * Mobile: full-width, abas dividem o espaço (flex 1 + minWidth 0) — nunca
 * extrapolam a tela; rótulos curtos via `shortLabel` (padrão SegmentedControl).
 */
export function LeadFormTabs({ value, onChange }: LeadFormTabsProps) {
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: 'stretch',
        alignSelf: { xs: 'stretch', sm: 'flex-start' },
        width: { xs: '100%', sm: 'auto' },
        maxWidth: '100%',
        minWidth: 0,
        bgcolor: (theme) => listifyElevatedSurface(theme),
        borderRadius: '12px',
        p: 0.5,
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
      }}
    >
      {TABS.map((tab) => {
        const active = value === tab.value;
        return (
          <Button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            disableRipple
            sx={{
              flex: { xs: '1 1 0', sm: '0 0 auto' },
              minWidth: 0,
              minHeight: 42,
              height: 42,
              px: { xs: 1, sm: 3 },
              py: 1,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: 1.55,
              color: active ? 'text.primary' : 'text.secondary',
              bgcolor: 'transparent',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: active ? 'transparent' : 'secondary.light',
                boxShadow: 'none',
              },
            }}
          >
            <Stack
              spacing={0.75}
              sx={{ alignItems: 'center', justifyContent: 'center', pt: active ? 0.25 : 0 }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 500,
                  lineHeight: 1.55,
                  color: 'inherit',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  {tab.shortLabel ?? tab.label}
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {tab.label}
                </Box>
              </Typography>
              <Box
                aria-hidden
                sx={{
                  width: 35,
                  height: 2,
                  borderRadius: '12px',
                  bgcolor: active ? 'warning.main' : 'transparent',
                }}
              />
            </Stack>
          </Button>
        );
      })}
    </Stack>
  );
}
