'use client';

import Link from 'next/link';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { Avatar, Box, Paper, Stack, Typography } from '@citybox/mui/atoms';
import type { SxProps, Theme } from '@mui/material/styles';
import { getAgentCatalogPath } from '@/features/shared/data/navigation';
import {
  catalogFloatingPaperSx,
  catalogHeaderIconButtonSx,
} from '../utils/catalog-chrome-styles';
import type { Agent } from '../types';

/**
 * Cabeçalho mínimo da página “Ver mais”: voltar + foto + nome (Listify flutuante).
 */
export function CatalogListingsIdentityHeader({ agent }: { agent: Agent }) {
  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        pt: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 2, md: 2.5 },
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={0}
        sx={[
          catalogFloatingPaperSx,
          {
            mx: 'auto',
            width: '100%',
            maxWidth: 1152,
            px: { xs: 1.25, sm: 2, md: 2.5 },
            py: { xs: 1, sm: 1.25 },
          },
        ] as SxProps<Theme>}
      >
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 1.5 }}
          sx={{ alignItems: 'center', minWidth: 0 }}
        >
          <Box
            component={Link}
            href={getAgentCatalogPath(agent.slug)}
            aria-label="Voltar ao catálogo"
            sx={catalogHeaderIconButtonSx}
          >
            <ArrowBackOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>

          <Avatar
            src={agent.photoUrl}
            alt={agent.name}
            sx={{
              width: { xs: 40, sm: 44 },
              height: { xs: 40, sm: 44 },
              borderRadius: '999px',
              bgcolor: 'primary.light',
              color: 'primary.dark',
              fontSize: '0.875rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {agent.initials}
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '0.9375rem', md: '1.125rem' },
                fontWeight: 600,
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {agent.name}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Imóveis disponíveis
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
