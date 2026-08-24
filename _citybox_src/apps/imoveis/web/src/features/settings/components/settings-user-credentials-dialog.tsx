'use client';

import { useState, type ReactNode } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  IconButton,
  Input,
  Stack,
} from '@citybox/mui/atoms';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal';
import { toast } from '@citybox/mui/molecules';
import { copyText } from '@/features/shared/utils/copy-text';
import { loginAsUser } from '../services/settings-service';
import { SETTINGS_MODAL_FIELD_SX } from '../utils/settings-form-styles';

type SettingsUserCredentialsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  login: string;
  temporaryPassword: string;
};

function ModalField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <Stack spacing={0.75}>
      <Box
        component="label"
        htmlFor={htmlFor}
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'text.secondary',
        }}
      >
        {label}
      </Box>
      {children}
    </Stack>
  );
}

export function SettingsUserCredentialsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  login,
  temporaryPassword,
}: SettingsUserCredentialsDialogProps) {
  const [copiedField, setCopiedField] = useState<'login' | 'password' | null>(null);

  async function handleCopy(field: 'login' | 'password', value: string) {
    const ok = await copyText(value);
    if (!ok) {
      toast.error('Não foi possível copiar');
      return;
    }
    setCopiedField(field);
    toast.success(field === 'login' ? 'Login copiado' : 'Senha copiada');
    window.setTimeout(() => setCopiedField(null), 1500);
  }

  function handleLoginNow() {
    const user = loginAsUser(userId);
    if (!user) {
      toast.error('Não foi possível entrar com este usuário');
      return;
    }
    toast.success(`Sessão mock: ${user.name}`);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
    >
      <ModalTitle>Credenciais provisórias</ModalTitle>
      <ModalContent>
        <ModalDescription className="mb-4">
          Login e senha provisória gerados para <strong>{userName}</strong>. Guarde
          agora — estes dados só são exibidos uma vez. O usuário entra com esta senha
          no Keycloak; a troca forçada no primeiro acesso vale apenas para o
          responsável criado pelo admin da plataforma.
        </ModalDescription>

        <Stack spacing={2}>
          <ModalField label="Login (e-mail)" htmlFor="settings-creds-login">
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Input
                id="settings-creds-login"
                value={login}
                fullWidth
                sx={SETTINGS_MODAL_FIELD_SX}
                slotProps={{
                  htmlInput: { readOnly: true },
                }}
              />
              <IconButton
                className="size-11 shrink-0 rounded-full"
                aria-label="Copiar login"
                color="inherit"
                onClick={() => handleCopy('login', login)}
                sx={{
                  color: 'text.secondary',
                  bgcolor: 'secondary.main',
                  '&:hover': {
                    color: 'text.primary',
                    bgcolor: 'secondary.dark',
                  },
                }}
              >
                {copiedField === 'login' ? (
                  <CheckIcon sx={{ fontSize: 16 }} />
                ) : (
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Stack>
          </ModalField>

          <ModalField label="Senha provisória" htmlFor="settings-creds-password">
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Input
                id="settings-creds-password"
                value={temporaryPassword}
                fullWidth
                sx={SETTINGS_MODAL_FIELD_SX}
                slotProps={{
                  htmlInput: {
                    readOnly: true,
                    style: {
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    },
                  },
                }}
              />
              <IconButton
                className="size-11 shrink-0 rounded-full"
                aria-label="Copiar senha"
                color="inherit"
                onClick={() => handleCopy('password', temporaryPassword)}
                sx={{
                  color: 'text.secondary',
                  bgcolor: 'secondary.main',
                  '&:hover': {
                    color: 'text.primary',
                    bgcolor: 'secondary.dark',
                  },
                }}
              >
                {copiedField === 'password' ? (
                  <CheckIcon sx={{ fontSize: 16 }} />
                ) : (
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Stack>
          </ModalField>
        </Stack>
      </ModalContent>

      <ModalActions>
        <ModalConfirmButton type="button" onClick={() => onOpenChange(false)}>
          Entendi
        </ModalConfirmButton>
      </ModalActions>
    </Modal>
  );
}
