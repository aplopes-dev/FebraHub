'use client';

import Link from 'next/link';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { Avatar, Box, Stack, Typography } from '@citybox/mui/atoms';
import { LeadContactPhoneButton } from '@/components/lead-contact-phone-button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { resolveLeadContactById } from '@/features/leads/utils/lead-contact';
import type { ContactLead } from '../types';

export function LeadsContactCard({ leads }: { leads: readonly ContactLead[] }) {
  return (
    <Panel
      sx={{
        display: 'flex',
        width: '100%',
        minWidth: 0,
        height: '100%',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <PanelHeader
        title="Contatos de leads"
        action={
          <Box
            component={Link}
            href="/leads"
            aria-label="Ver todos os leads"
            sx={{
              display: 'inline-flex',
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '999px',
              bgcolor: 'secondary.main',
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': { bgcolor: 'secondary.dark', color: 'text.primary' },
            }}
          >
            <NorthEastIcon sx={{ fontSize: 14 }} />
          </Box>
        }
      />

      <Stack component="ul" spacing={0} sx={{ listStyle: 'none', m: 0, p: 0, width: '100%' }}>
        {leads.map((lead) => (
          <Stack
            component="li"
            key={lead.id}
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
              width: '100%',
              borderRadius: '12px',
              py: 1.25,
              px: 0.5,
              '&:hover': { bgcolor: 'secondary.main' },
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'secondary.main',
                color: 'text.primary',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {lead.initials}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                {lead.name}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.75rem',
                  fontWeight: 300,
                }}
              >
                {lead.city}, {lead.state}
              </Typography>
            </Box>

            <LeadContactPhoneButton
              contact={resolveLeadContactById(lead)}
              size="lg"
              side="left"
            />
          </Stack>
        ))}
      </Stack>
    </Panel>
  );
}
