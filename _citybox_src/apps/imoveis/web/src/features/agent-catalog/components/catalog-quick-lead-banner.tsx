'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import { getNewLeadPath } from '@/features/shared/data/navigation';
import { useAuthSession } from '@/lib/session-context';

type CatalogQuickLeadBannerProps = {
  propertyId: string;
};

/**
 * Interceptor WhatsApp em páginas públicas do imóvel.
 * Lê `?action=new-lead` no client + sessão Keycloak (`/api/auth/session`).
 * Anônimos: o parâmetro é ignorado (sem CTA).
 */
function CatalogQuickLeadBannerInner({ propertyId }: CatalogQuickLeadBannerProps) {
  const searchParams = useSearchParams();
  const { status, session, refresh } = useAuthSession();

  const isActionNewLead = searchParams.get('action') === 'new-lead';

  useEffect(() => {
    if (!isActionNewLead) return;
    if (status === 'loading') {
      void refresh();
    }
  }, [isActionNewLead, status, refresh]);

  if (!isActionNewLead) return null;
  if (status === 'loading') return null;
  if (status !== 'authenticated' || !session) return null;

  const href = getNewLeadPath({
    propertyId,
    source: 'whatsapp',
  });
  const agentName = session.user.name?.trim();

  return (
    <Box
      component="aside"
      role="region"
      aria-label="Ação rápida de lead para corretor"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderBottom: '1px solid',
        borderColor: 'primary.main',
        bgcolor: 'action.hover',
        px: { xs: 2, md: 3 },
        py: 1.25,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.25}
        sx={{
          maxWidth: 1152,
          mx: 'auto',
          width: '100%',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            minWidth: 0,
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <LightbulbOutlinedIcon
            sx={{ fontSize: 22, color: 'primary.main', flexShrink: 0, mt: 0.25 }}
            aria-hidden
          />
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: 1.4,
              color: 'text.primary',
            }}
          >
            Você está acessando este imóvel como corretor
            {agentName ? ` (${agentName})` : ''}. Deseja cadastrar um cliente
            interessado?
          </Typography>
        </Stack>
        <Button
          component={Link}
          href={href}
          variant="contained"
          size="small"
          sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Criar Lead para este Imóvel
        </Button>
      </Stack>
    </Box>
  );
}

/** Wrapper com Suspense — `useSearchParams` exige boundary no App Router. */
export function CatalogQuickLeadBanner({ propertyId }: CatalogQuickLeadBannerProps) {
  return (
    <Suspense fallback={null}>
      <CatalogQuickLeadBannerInner propertyId={propertyId} />
    </Suspense>
  );
}
