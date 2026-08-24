'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Box, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import CircularProgress from '@mui/material/CircularProgress';
import {
  resolveStoreLogoUrl,
  uploadStoreLogo,
  deleteStoreLogo,
} from '../services/settings-service';
import { settingsMutedTextSx } from '@/features/settings/lib/settings-muted';

const ACCEPTED_LOGO_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const LOGO_MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED_LOGO_EXTENSIONS = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

type StoreLogoUploadProps = {
  logoUrl: string | null;
  disabled?: boolean;
  onChanged: () => void;
};

function validateLogoFile(file: File): string | null {
  const isAccepted =
    ACCEPTED_LOGO_TYPES.has(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isAccepted) {
    return 'Envie apenas arquivos JPG, PNG ou WebP.';
  }

  if (file.size > LOGO_MAX_BYTES) {
    return 'A imagem é muito pesada. Envie um arquivo de até 4 MB.';
  }

  return null;
}

export function StoreLogoUpload({
  logoUrl,
  disabled = false,
  onChanged,
}: StoreLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const isDisabled = disabled || busy;

  useEffect(() => {
    if (!logoUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null);
      return;
    }
    const url = resolveStoreLogoUrl(logoUrl);
    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(`${url}&t=${Date.now()}`);
  }, [logoUrl]);

  const handleFile = async (file: File | undefined) => {
    if (!file || isDisabled) return;

    const validationError = validateLogoFile(file);
    if (validationError) {
      setError(validationError);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }

    setError(undefined);
    setBusy(true);
    try {
      await uploadStoreLogo(file);
      onChanged();
      toast.success('Logotipo atualizado com sucesso');
    } catch {
      toast.error('Não foi possível enviar o logotipo');
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (event: MouseEvent) => {
    event.stopPropagation();
    if (isDisabled) return;
    setBusy(true);
    try {
      await deleteStoreLogo();
      setError(undefined);
      onChanged();
      toast.success('Logotipo removido com sucesso');
    } catch {
      toast.error('Não foi possível remover o logotipo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: { xs: 140, lg: 0 },
        width: '100%',
        height: '100%',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_LOGO_EXTENSIONS}
        disabled={isDisabled}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
        }}
        style={{ display: 'none' }}
      />

      <Box
        component="button"
        type="button"
        disabled={isDisabled}
        aria-label="Enviar logo do estabelecimento"
        onClick={() => inputRef.current?.click()}
        sx={{
          position: 'relative',
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: { xs: 140, lg: '100%' },
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          p: 0,
          borderRadius: 3,
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
          '&:hover': isDisabled
            ? undefined
            : {
                borderColor: 'primary.main',
                bgcolor: 'action.selected',
              },
        }}
      >
        {preview ? (
          <>
            <Box
              role="img"
              aria-label="Pré-visualização da logo do estabelecimento"
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${preview})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            {!disabled ? (
              <IconButton
                size="small"
                aria-label="Remover logo"
                onClick={(event) => {
                  void handleDelete(event);
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 28,
                  height: 28,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.paper' },
                }}
              >
                <Icon name="delete" size={14} />
              </IconButton>
            ) : null}
          </>
        ) : (
          <Stack spacing={0.75} sx={{ alignItems: 'center', px: 1.5, ...settingsMutedTextSx }}>
            <Icon name="upload" size={24} />
            <Typography variant="caption" sx={{ fontSize: 11, lineHeight: 1.3, textAlign: 'center' }}>
              JPG, PNG ou WebP · máx. 4 MB
            </Typography>
          </Stack>
        )}

        {busy ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.55)',
            }}
          >
            <CircularProgress size={22} />
          </Box>
        ) : null}
      </Box>

      {error ? (
        <Typography variant="body2" color="error" role="alert" sx={{ mt: 1 }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
