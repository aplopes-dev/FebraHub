'use client';

import type { ReactNode } from 'react';
import { Avatar, Stack, Typography } from '@citybox/mui/atoms';
import { primarySoftSurface } from '@/theme/accent-styles';
import { useAuthBlobUrl } from '../hooks/use-auth-blob-url';
import type { AgentProfile } from '../types';

export function SettingsProfileHeader({
  profile,
  photoRevision,
  action,
}: {
  profile: AgentProfile;
  /** Bump após upload/remoção — o path da foto não muda entre versões. */
  photoRevision?: number;
  /** Ações na mesma linha da foto (ex.: Alterar foto). */
  action?: ReactNode;
}) {
  const photoSrc = useAuthBlobUrl(profile.photoUrl, photoRevision);

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        width: '100%',
        minWidth: 0,
        flexWrap: 'nowrap',
      }}
    >
      <Avatar
        src={photoSrc}
        alt={photoSrc ? `Foto de ${profile.name}` : undefined}
        className="size-16 sm:size-20"
        sx={(theme) => ({
          width: { xs: 64, sm: 80 },
          height: { xs: 64, sm: 80 },
          flexShrink: 0,
          overflow: 'hidden',
          bgcolor: primarySoftSurface(theme, 0.18),
          color: 'primary.main',
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
          fontWeight: 600,
          '& img': {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          },
        })}
      >
        {profile.initials}
      </Avatar>
      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          component="h2"
          variant="h5"
          className="truncate tracking-tight"
        >
          {profile.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {profile.role}
        </Typography>
      </Stack>
      {action ? (
        <Stack sx={{ flexShrink: 0, minWidth: 0 }}>{action}</Stack>
      ) : null}
    </Stack>
  );
}
