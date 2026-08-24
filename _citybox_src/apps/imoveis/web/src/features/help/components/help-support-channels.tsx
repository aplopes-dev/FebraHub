'use client';

import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { StatIconBadge } from '@/components/ui/stat-icon-badge';
import type {
  HelpSupportChannel,
  HelpSupportChannelId,
} from '../data/help-content';

const CHANNEL_ICONS: Record<
  HelpSupportChannelId,
  ComponentType<SvgIconProps>
> = {
  whatsapp: ChatOutlinedIcon,
  phone: PhoneOutlinedIcon,
  status: VerifiedOutlinedIcon,
};

type HelpSupportChannelsProps = {
  channels: readonly HelpSupportChannel[];
  onOpenTicket: () => void;
};

export function HelpSupportChannels({
  channels,
  onOpenTicket,
}: HelpSupportChannelsProps) {
  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Typography
          component="h2"
          sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          Canais de atendimento
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={onOpenTicket}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: '12px',
            height: 44,
            px: 2,
            alignSelf: { xs: 'stretch', sm: 'auto' },
          }}
        >
          Abrir ticket de suporte
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {channels.map((channel) => {
          const Icon = CHANNEL_ICONS[channel.id];
          return (
            <Panel key={channel.id} sx={{ p: 2 }}>
              <Stack spacing={1}>
                <StatIconBadge icon={Icon} size="sm" />
                <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {channel.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    lineHeight: 1.55,
                    color: 'text.secondary',
                  }}
                >
                  {channel.description}
                </Typography>
                <Typography
                  sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'text.primary' }}
                >
                  {channel.detail}
                </Typography>
              </Stack>
            </Panel>
          );
        })}
      </Box>
    </Box>
  );
}
