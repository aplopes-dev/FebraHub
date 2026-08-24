'use client';

import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';

type PublicDocumentOpenPageProps = {
  token: string;
};

export function PublicDocumentOpenPage({ token }: PublicDocumentOpenPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleOpen() {
    setBusy(true);
    setError(null);
    try {
      const ack = await fetch(
        `/api/public/documents/${encodeURIComponent(token)}/ack`,
        { method: 'POST' },
      );
      if (!ack.ok) {
        setError(
          ack.status === 404
            ? 'Este link expirou ou não existe mais.'
            : 'Não foi possível abrir o documento.',
        );
        return;
      }
      window.location.assign(
        `/api/public/documents/${encodeURIComponent(token)}`,
      );
    } catch {
      setError('Não foi possível abrir o documento.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100svh',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        bgcolor: 'background.default',
      }}
    >
      <Stack
        spacing={2}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 3,
          borderRadius: '20px',
          bgcolor: 'background.paper',
          boxShadow: 1,
        }}
      >
        <Typography component="h1" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Documento
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Toque para abrir o arquivo. O corretor verá que você visualizou.
        </Typography>
        {error ? (
          <Typography color="error" sx={{ fontSize: '0.875rem' }}>
            {error}
          </Typography>
        ) : null}
        <Button
          type="button"
          variant="contained"
          disabled={busy}
          onClick={() => {
            void handleOpen();
          }}
          sx={{ textTransform: 'none', borderRadius: '12px' }}
        >
          {busy ? 'Abrindo…' : 'Abrir documento'}
        </Button>
      </Stack>
    </Box>
  );
}
