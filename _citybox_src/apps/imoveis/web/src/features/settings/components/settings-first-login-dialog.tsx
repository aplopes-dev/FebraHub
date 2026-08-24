'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Box, Stack } from '@citybox/mui/atoms';
import {
  Modal,
  ModalActions,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal';
import { PasswordInput, toast } from '@citybox/mui/molecules';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import {
  useCompleteFirstLoginMutation,
  useTeamMembersQuery,
} from '../hooks/use-settings-queries';
import { SETTINGS_MODAL_FIELD_SX } from '../utils/settings-form-styles';

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

export function SettingsFirstLoginDialog() {
  const sessionUser = useSessionUser();
  const { data: members = [] } = useTeamMembersQuery();
  const completeLogin = useCompleteFirstLoginMutation();
  const teamUser = useMemo(
    () => members.find((m) => m.id === sessionUser.id),
    [members, sessionUser.id],
  );

  // Sem modal interno: troca definitiva é o UPDATE_PASSWORD do Keycloak no login.
  // mustChangePassword na API fica false (OWNER e equipe).
  const open = Boolean(
    teamUser?.mustChangePassword && teamUser.role !== 'admin',
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit() {
    if (!teamUser) return;
    if (newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação da senha não confere');
      return;
    }

    try {
      await completeLogin.mutateAsync({ agentId: teamUser.id, newPassword });
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha atualizada. Bem-vindo(a)!');
    } catch {
      toast.error('Não foi possível atualizar a senha');
    }
  }

  if (!teamUser) return null;

  return (
    <Modal
      open={open}
      onClose={() => {
        // Obrigatório — ignora tentativa de fechar sem trocar a senha.
      }}
      maxWidth="sm"
    >
      <ModalTitle>Bem-vindo(a), {teamUser.name.split(' ')[0]}!</ModalTitle>
      <ModalContent>
        <ModalDescription className="mb-4">
          Este é o seu primeiro acesso. Por segurança, defina uma nova senha para
          continuar usando o painel. A senha provisória deixará de valer.
        </ModalDescription>

        <Stack spacing={2}>
          <div className="rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3 text-sm">
            <p className="font-medium">{teamUser.name}</p>
            <p className="text-muted-foreground">{teamUser.email}</p>
          </div>

          <ModalField label="Nova senha" htmlFor="settings-first-login-password">
            <PasswordInput
              id="settings-first-login-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              fullWidth
              sx={SETTINGS_MODAL_FIELD_SX}
            />
          </ModalField>

          <ModalField
            label="Confirmar nova senha"
            htmlFor="settings-first-login-confirm"
          >
            <PasswordInput
              id="settings-first-login-confirm"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a nova senha"
              fullWidth
              sx={SETTINGS_MODAL_FIELD_SX}
            />
          </ModalField>
        </Stack>
      </ModalContent>

      <ModalActions>
        <ModalConfirmButton
          type="button"
          onClick={handleSubmit}
          disabled={completeLogin.isPending}
        >
          Salvar senha e continuar
        </ModalConfirmButton>
      </ModalActions>
    </Modal>
  );
}
