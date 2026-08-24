'use client';

import { Avatar, Box, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';

export type LeadPickerPreviewLead = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  initials?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function leadSubtitle(lead: LeadPickerPreviewLead): string {
  const email = lead.email?.trim();
  const phone = lead.phone?.trim();
  if (email && phone) return `${email} · ${phone}`;
  if (email) return email;
  if (phone) return phone;
  return 'Sem telefone ou e-mail';
}

/**
 * Card compacto do lead selecionado em modais.
 * Superfície neutra do tema (sem tint do accent) — legível em light/dark.
 */
export function LeadPickerPreview({ lead }: { lead: LeadPickerPreviewLead }) {
  return (
    <Panel
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        p: 1.5,
        borderRadius: '12px',
        bgcolor: 'secondary.light',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
      }}
    >
      <Avatar
        src={lead.photoUrl ?? undefined}
        alt={lead.name}
        sx={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          bgcolor: 'action.selected',
          color: 'text.secondary',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {lead.initials || initialsFromName(lead.name)}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          noWrap
          sx={{
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.35,
            color: 'text.primary',
          }}
        >
          {lead.name}
        </Typography>
        <Typography
          noWrap
          sx={{
            fontSize: '0.75rem',
            fontWeight: 400,
            lineHeight: 1.35,
            color: 'text.secondary',
          }}
        >
          {leadSubtitle(lead)}
        </Typography>
      </Box>
    </Panel>
  );
}
