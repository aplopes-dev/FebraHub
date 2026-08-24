'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { FormField } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import type { MemberProvisionalCredentials } from '../types/member.types';

type Props = {
  open: boolean;
  credentials: MemberProvisionalCredentials | null;
  onClose: () => void;
};

export function MemberCredentialsDialog({ open, credentials, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!credentials) return null;

  const handleCopy = async () => {
    const text = [
      `Usuário: ${credentials.username}`,
      `Senha provisória: ${credentials.provisionalPassword}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon name="users" size={24} sx={{ color: 'primary.main' }} />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {credentials.title ?? 'Membro convidado'}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="warning">
            Guarde a senha provisória agora — ela só é exibida uma vez. No primeiro
            acesso a plataforma pedirá a troca de senha.
          </Alert>
          {credentials.subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {credentials.subtitle}
            </Typography>
          ) : null}
          <FormField
            label="Usuário"
            value={credentials.username}
            fullWidth
            slotProps={{ input: { readOnly: true } }}
          />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <FormField
              label="Senha provisória"
              value={credentials.provisionalPassword}
              fullWidth
              slotProps={{ input: { readOnly: true } }}
            />
            <Tooltip title={copied ? 'Copiado' : 'Copiar credenciais'}>
              <IconButton
                onClick={() => void handleCopy()}
                aria-label="Copiar credenciais"
                sx={{ mt: 3 }}
              >
                <Icon name="copy" size={20} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="contained" onClick={onClose}>
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
  );
}
