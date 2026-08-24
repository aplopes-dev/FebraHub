'use client';

import { Box, Typography } from '@citybox/mui/atoms';
import { SearchInput } from '@citybox/mui/molecules';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';

type HelpHeroProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function HelpHero({ query, onQueryChange }: HelpHeroProps) {
  return (
    <Box component="header" sx={{ flexShrink: 0 }}>
      <Typography
        color="text.secondary"
        sx={{ fontSize: '0.8125rem', fontWeight: 500, mb: 0.75 }}
      >
        Central de ajuda
      </Typography>
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: '1.5rem', sm: '1.875rem' },
          fontWeight: 600,
          letterSpacing: '-0.025em',
          lineHeight: 1.25,
          color: 'text.primary',
        }}
      >
        Como podemos ajudar você hoje?
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          fontSize: '0.9375rem',
          color: 'text.secondary',
          maxWidth: 560,
        }}
      >
        Busque um módulo, um artigo ou abra um chamado para o time de suporte.
      </Typography>
      <SearchInput
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Buscar módulos, artigos e dúvidas…"
        slotProps={{
          htmlInput: { 'aria-label': 'Buscar na central de ajuda' },
        }}
        sx={{
          mt: 2.5,
          width: '100%',
          maxWidth: 560,
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            height: 48,
            bgcolor: (theme) => listifyElevatedSurface(theme),
            boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
            '& fieldset': { border: 'none' },
          },
        }}
      />
    </Box>
  );
}
