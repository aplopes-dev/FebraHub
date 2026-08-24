'use client';

import { Box, Paper, Typography } from '@citybox/mui/atoms';
import type { SxProps, Theme } from '@mui/material/styles';
import { formatAgentLocation, formatCreciLabel } from '../utils/agent-display';
import { catalogFloatingPaperSx } from '../utils/catalog-chrome-styles';
import { PublicLeadForm } from './public-lead-form';
import type { Agent } from '../types';

export function CatalogFooter({ agent }: { agent: Agent }) {
  const location = formatAgentLocation(agent.city, agent.state);
  const creciLabel = formatCreciLabel(agent.creci);

  return (
    <Box
      component="footer"
      aria-label="Formulário de contato com o corretor"
      sx={{
        mt: { xs: 5, md: 8 },
        px: { xs: 1.5, sm: 2, md: 2.5 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ mx: 'auto', width: '100%', maxWidth: 1152 }}>
        <Paper
          elevation={0}
          sx={[catalogFloatingPaperSx, { p: { xs: 2.5, md: 4 } }] as SxProps<Theme>}
        >
          <PublicLeadForm agentSlug={agent.slug} />
        </Paper>

        <Typography
          color="text.secondary"
          sx={{ mt: { xs: 3, md: 4 }, fontSize: '0.875rem' }}
        >
          {agent.name}
          {creciLabel ? ` · ${creciLabel}` : ''}
          {location ? ` · ${location}` : ''}
        </Typography>
      </Box>
    </Box>
  );
}
