'use client';

import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import { Box, Button, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import {
  useConnectGoogleCalendarMutation,
  useDisconnectGoogleCalendarMutation,
  useGoogleCalendarStatusQuery,
  useSyncPendingGoogleCalendarMutation,
} from '../hooks/use-settings-queries';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * Card de gestão Google Calendar no perfil.
 * Conexão rápida principal fica no banner da Agenda; OAuth callback → `/calendar?connected=…`.
 */
export function SettingsGoogleCalendarCard() {
  const { data: status, isPending, isError } = useGoogleCalendarStatusQuery();
  const connect = useConnectGoogleCalendarMutation();
  const disconnect = useDisconnectGoogleCalendarMutation();
  const syncPending = useSyncPendingGoogleCalendarMutation();

  function handleConnect() {
    connect.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.assign(url);
      },
      onError: (error) =>
        toast.error(errorMessage(error, 'Falha ao iniciar conexão com o Google')),
    });
  }

  function handleDisconnect() {
    disconnect.mutate(undefined, {
      onSuccess: () => toast.success('Google Calendar desconectado'),
      onError: (error) =>
        toast.error(errorMessage(error, 'Falha ao desconectar')),
    });
  }

  function handleSyncPending() {
    syncPending.mutate(undefined, {
      onSuccess: ({ synced }) => {
        if (synced === 0) {
          toast.success('Nenhum compromisso pendente para o Google.');
          return;
        }
        toast.success(
          synced === 1
            ? '1 compromisso foi enviado ao Google Calendar.'
            : `${synced} compromissos foram enviados ao Google Calendar.`,
        );
      },
      onError: (error) =>
        toast.error(
          errorMessage(error, 'Falha ao sincronizar compromissos pendentes'),
        ),
    });
  }

  const connected = status?.connected === true;
  const configured = status?.configured !== false;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <EventAvailableOutlinedIcon
          sx={{ color: 'primary.main', mt: 0.25, fontSize: 28 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1,
              mb: 0.5,
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Google Calendar
            </Typography>
            {connected ? (
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1,
                  py: 0.25,
                  borderRadius: 999,
                  bgcolor: 'success.main',
                  color: 'success.contrastText',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Agenda conectada
              </Box>
            ) : null}
          </Box>
          <Typography
            sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.5 }}
          >
            Sincronize visitas e compromissos da Agenda com o seu Google
            Calendar. Cada corretor conecta a própria conta — os eventos vão
            para o calendário de quem está responsável pelo compromisso.
          </Typography>
        </Box>
      </Box>

      {isPending ? (
        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          Carregando integração…
        </Typography>
      ) : null}

      {isError ? (
        <Typography sx={{ fontSize: '0.875rem', color: 'error.main' }}>
          Não foi possível carregar o status da integração.
        </Typography>
      ) : null}

      {!isPending && status && !configured ? (
        <Typography sx={{ fontSize: '0.875rem', color: 'warning.main' }}>
          Integração não configurada no servidor (defina GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI na API).
        </Typography>
      ) : null}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
        {connected ? (
          <>
            <Button
              type="button"
              variant="outlined"
              size="small"
              startIcon={<SyncOutlinedIcon />}
              disabled={syncPending.isPending || disconnect.isPending}
              onClick={handleSyncPending}
            >
              {syncPending.isPending
                ? 'Sincronizando…'
                : 'Sincronizar pendentes'}
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<LinkOffOutlinedIcon />}
              disabled={disconnect.isPending || syncPending.isPending}
              onClick={handleDisconnect}
            >
              {disconnect.isPending ? 'Desconectando…' : 'Desconectar'}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="contained"
            size="small"
            disabled={connect.isPending || !configured}
            onClick={handleConnect}
          >
            {connect.isPending
              ? 'Redirecionando…'
              : 'Conectar meu Google Calendar'}
          </Button>
        )}
      </Box>
    </Box>
  );
}
