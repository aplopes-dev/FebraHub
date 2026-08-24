'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { Box, Button, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import {
  useConnectGoogleCalendarMutation,
  useGoogleCalendarStatusQuery,
  useSyncPendingGoogleCalendarMutation,
} from '@/features/settings/hooks/use-settings-queries';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Banner de conexão rápida na Agenda + badge quando conectado.
 * Callback OAuth: `/calendar?connected=true|error`.
 * Com Google já conectado (ou após OAuth), dispara backfill dos compromissos antigos.
 */
export function CalendarGoogleBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handledCallback = useRef(false);
  const pendingSyncStarted = useRef(false);

  const { data: status, isPending, refetch } = useGoogleCalendarStatusQuery();
  const connect = useConnectGoogleCalendarMutation();
  const syncPending = useSyncPendingGoogleCalendarMutation();

  function runPendingSync(opts?: { toastOnSynced?: boolean }) {
    if (pendingSyncStarted.current || syncPending.isPending) return;
    pendingSyncStarted.current = true;
    syncPending.mutate(undefined, {
      onSuccess: ({ synced }) => {
        if (opts?.toastOnSynced && synced > 0) {
          toast.success(
            synced === 1
              ? '1 compromisso foi enviado ao Google Calendar.'
              : `${synced} compromissos foram enviados ao Google Calendar.`,
          );
        }
      },
      onError: () => {
        // Permite nova tentativa no próximo mount / reconexão.
        pendingSyncStarted.current = false;
      },
    });
  }

  useEffect(() => {
    if (handledCallback.current) return;
    const flag = searchParams.get('connected');
    if (!flag) return;
    handledCallback.current = true;

    if (flag === 'true') {
      toast.success('Sua agenda do Google foi conectada com sucesso!');
      void refetch();
      runPendingSync({ toastOnSynced: true });
    } else if (flag === 'error') {
      toast.error('Não foi possível conectar o Google Calendar');
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete('connected');
    next.delete('reason');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on OAuth callback
  }, [searchParams, router, pathname, refetch]);

  // Ao abrir a Agenda já conectado: backfill silencioso dos sem googleEventId.
  useEffect(() => {
    if (isPending || !status?.connected) return;
    runPendingSync({ toastOnSynced: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per “connected” state
  }, [isPending, status?.connected]);

  function handleConnect() {
    connect.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.assign(url);
      },
      onError: (error) =>
        toast.error(
          errorMessage(error, 'Falha ao iniciar conexão com o Google'),
        ),
    });
  }

  if (isPending) return null;

  if (status?.connected) {
    return (
      <Box
        sx={{
          flexShrink: 0,
          display: 'inline-flex',
          alignSelf: 'flex-start',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
          bgcolor: 'rgba(34, 197, 94, 0.12)',
          color: 'success.dark',
          border: '1px solid',
          borderColor: 'rgba(34, 197, 94, 0.28)',
        }}
        aria-label="Google Calendar conectado"
      >
        <Box
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: 'success.main',
            flexShrink: 0,
          }}
        />
        <Typography
          component="span"
          sx={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3 }}
        >
          Google Calendar Conectado
        </Typography>
      </Box>
    );
  }

  const configured = status?.configured !== false;

  return (
    <Box
      role="region"
      aria-label="Conectar Google Calendar"
      sx={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 1.5, sm: 2 },
        p: { xs: 1.75, sm: 2 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(37, 99, 235, 0.12)'
            : 'rgba(239, 246, 255, 0.95)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.25,
          flex: 1,
          minWidth: 0,
        }}
      >
        <EventAvailableOutlinedIcon
          sx={{
            color: 'primary.main',
            fontSize: 28,
            mt: 0.25,
            flexShrink: 0,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: { xs: '0.9375rem', sm: '1rem' },
              lineHeight: 1.35,
              mb: 0.5,
            }}
          >
            Sincronize seus compromissos com o celular!
          </Typography>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            Conecte sua conta do Google para receber avisos de visitas e
            reuniões diretamente na agenda do seu smartphone.
          </Typography>
          {!configured ? (
            <Typography
              sx={{
                mt: 0.75,
                fontSize: '0.8125rem',
                color: 'warning.main',
              }}
            >
              Integração ainda não configurada no servidor (GOOGLE_CLIENT_ID /
              SECRET / REDIRECT_URI).
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Button
        type="button"
        variant="contained"
        size="medium"
        disabled={connect.isPending || !configured}
        onClick={handleConnect}
        sx={{
          flexShrink: 0,
          alignSelf: { xs: 'stretch', sm: 'center' },
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '12px',
          whiteSpace: 'nowrap',
        }}
      >
        {connect.isPending ? 'Redirecionando…' : 'Conectar Google Calendar'}
      </Button>
    </Box>
  );
}
