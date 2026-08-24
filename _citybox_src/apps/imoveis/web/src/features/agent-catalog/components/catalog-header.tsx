'use client';

import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { Avatar, Box, Paper, Stack, Typography } from '@citybox/mui/atoms';
import type { SxProps, Theme } from '@mui/material/styles';
import { telHref } from '@/features/shared/utils/lead-contact';
import { formatAgentLocation, formatCreciLabel } from '../utils/agent-display';
import { catalogFloatingPaperSx } from '../utils/catalog-chrome-styles';
import { CatalogPublicShareButton } from './catalog-public-share-button';
import { CatalogThemeSettings } from './catalog-theme-settings';
import type { Agent } from '../types';

type CatalogHeaderProps = {
  agent: Agent;
  /** Compacto: só barra sticky (detalhe). Completo: inclui CRECI/telefone no Paper. */
  variant?: 'full' | 'bar';
};

/**
 * Header Listify sticky do catálogo público — Paper flutuante (16–20px),
 * alinhado ao topbar do painel. Sem faixa full-bleed nem glass hardcoded.
 */
export function CatalogHeader({ agent, variant = 'full' }: CatalogHeaderProps) {
  const location = formatAgentLocation(agent.city, agent.state);
  const creciLabel = formatCreciLabel(agent.creci);
  const showMeta = variant === 'full' && Boolean(creciLabel || agent.phone);

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        pt: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 2, md: 2.5 },
        pb: 0,
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
          <Avatar
            src={agent.photoUrl}
            alt={agent.name}
            sx={{
              width: { xs: 40, sm: 44 },
              height: { xs: 40, sm: 44 },
              borderRadius: '999px',
              bgcolor: 'primary.light',
              color: 'primary.dark',
              fontSize: '0.8125rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {agent.initials}
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component={variant === 'full' ? 'h1' : 'p'}
              sx={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {agent.name}
            </Typography>
            {location ? (
              <Typography
                color="text.secondary"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.75rem',
                  lineHeight: 1.3,
                  maxWidth: '100%',
                }}
              >
                <LocationOnOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} aria-hidden />
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {location}
                </Box>
              </Typography>
            ) : null}
            {showMeta ? (
              <Typography
                color="text.secondary"
                component="div"
                sx={{
                  mt: 0.25,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 0.75,
                }}
              >
                {creciLabel ? <span>{creciLabel}</span> : null}
                {creciLabel && agent.phone ? <span aria-hidden>·</span> : null}
                {agent.phone ? (
                  <Box
                    component="a"
                    href={telHref(agent.phone)}
                    aria-label={`Ligar para ${agent.name}: ${agent.phone}`}
                    sx={{
                      color: 'inherit',
                      textDecoration: 'underline',
                      textUnderlineOffset: 2,
                      minHeight: 32,
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {agent.phone}
                  </Box>
                ) : null}
              </Typography>
            ) : null}
          </Box>

          <Stack
            direction="row"
            spacing={{ xs: 0.5, sm: 1 }}
            sx={{ alignItems: 'center', flexShrink: 0 }}
          >
            <CatalogPublicShareButton agentSlug={agent.slug} agentName={agent.name} />
            <CatalogThemeSettings />
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
