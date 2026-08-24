'use client';

import { useEffect, useMemo, useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import {
  Box,
  Button,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import {
  peekAuthBlobUrl,
  resolveAuthBlobUrl,
} from '@/lib/auth-blob-cache';

export type ViewableDocument = {
  name: string;
  sizeLabel: string;
  /** Object URL ou data URL — ausente = só metadados (ex.: veio da API). */
  fileUrl?: string;
  /** Path relativo autenticado da API (ex.: `/v1/properties/:id/documents/:docId`). */
  path?: string;
  /** Arquivo local ainda não enviado. */
  file?: File;
};

type DocumentViewerDialogProps = {
  open: boolean;
  document: ViewableDocument | null;
  onOpenChange: (open: boolean) => void;
};

function isPdf(name: string): boolean {
  return /\.pdf$/i.test(name);
}

type DocumentContent = {
  url?: string;
  status: 'none' | 'loading' | 'ready' | 'error';
};

/** Resolve o conteúdo exibível: arquivo local, URL pronta ou blob autenticado. */
function useDocumentContent(document: ViewableDocument | null): DocumentContent {
  const file = document?.file;
  const fileUrl = document?.fileUrl;
  const path = document?.path;

  const localUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    if (!localUrl) return;
    return () => URL.revokeObjectURL(localUrl);
  }, [localUrl]);

  const remotePath = !file && !fileUrl ? path : undefined;
  const [, setEpoch] = useState(0);
  const [failedPath, setFailedPath] = useState<string | null>(null);

  useEffect(() => {
    if (!remotePath) return;
    if (peekAuthBlobUrl(remotePath)) return;

    let cancelled = false;
    void resolveAuthBlobUrl(remotePath)
      .then(() => {
        if (!cancelled) setEpoch((n) => n + 1);
      })
      .catch(() => {
        if (!cancelled) setFailedPath(remotePath);
      });

    return () => {
      cancelled = true;
    };
  }, [remotePath]);

  if (localUrl) return { url: localUrl, status: 'ready' };
  if (fileUrl) return { url: fileUrl, status: 'ready' };
  if (!remotePath) return { status: 'none' };
  const cached = peekAuthBlobUrl(remotePath);
  if (cached) return { url: cached, status: 'ready' };
  if (failedPath === remotePath) return { status: 'error' };
  return { status: 'loading' };
}

export function DocumentViewerDialog({
  open,
  document,
  onOpenChange,
}: DocumentViewerDialogProps) {
  const { url: documentUrl, status } = useDocumentContent(
    open ? document : null,
  );
  const canPreviewPdf = Boolean(documentUrl && document && isPdf(document.name));
  const canDownload = Boolean(documentUrl);

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <ModalTitle
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          pr: 6,
        }}
      >
        <Typography component="span" noWrap sx={{ fontWeight: 600, display: 'block' }}>
          {document?.name ?? 'Documento'}
        </Typography>
        <ModalDescription sx={{ mt: 0.5, mb: 0 }}>
          {document?.sizeLabel ? `${document.sizeLabel}` : 'Pré-visualização'}
        </ModalDescription>
      </ModalTitle>

      <ModalContent
        sx={{
          p: 0,
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'secondary.dark'
              : 'secondary.light',
        }}
      >
        {canPreviewPdf && documentUrl && document ? (
          <Box
            component="iframe"
            title={`Pré-visualização de ${document.name}`}
            src={documentUrl}
            sx={{
              height: 'min(70vh, 640px)',
              width: '100%',
              border: 0,
              bgcolor: (theme) => listifyElevatedSurface(theme),
              display: 'block',
            }}
          />
        ) : (
          <Stack
            spacing={1.5}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 240,
              px: 3,
              py: 6,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                width: 56,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                bgcolor: 'error.light',
                color: 'error.main',
              }}
            >
              <DescriptionOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box sx={{ maxWidth: 384 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                {status === 'ready'
                  ? 'Pré-visualização indisponível para este formato'
                  : status === 'loading'
                    ? 'Carregando arquivo…'
                    : status === 'error'
                      ? 'Não foi possível carregar o arquivo'
                      : 'Arquivo não disponível para visualização'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {status === 'ready'
                  ? 'DOC e DOCX precisam ser abertos no aplicativo correspondente. Use o download abaixo.'
                  : status === 'loading'
                    ? 'Buscando o documento no servidor.'
                    : status === 'error'
                      ? 'Tente novamente em instantes.'
                      : 'Este documento foi salvo só com o nome. Envie o arquivo de novo para visualizar ou baixar.'}
              </Typography>
            </Box>
          </Stack>
        )}
      </ModalContent>

      <ModalActions
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          py: 2,
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ alignSelf: 'center', maxWidth: '40%' }}
        >
          {document?.name}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          {canDownload && documentUrl && document ? (
            <Button
              type="button"
              variant="outlined"
              component="a"
              href={documentUrl}
              startIcon={<DownloadIcon />}
              {...{ download: document.name }}
            >
              Baixar
            </Button>
          ) : null}
          <ModalCancelButton type="button" onClick={() => onOpenChange(false)}>
            Fechar
          </ModalCancelButton>
        </Stack>
      </ModalActions>
    </Modal>
  );
}
