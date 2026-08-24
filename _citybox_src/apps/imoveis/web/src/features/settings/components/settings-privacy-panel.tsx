'use client';

import { useState } from 'react';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Button, IconButton, Switch } from '@citybox/mui/atoms';
import { PasswordInput, toast } from '@citybox/mui/molecules';
import { Panel } from '@/components/ui/panel';
import {
  useChangePasswordMutation,
  usePrivacyQuery,
  usePutPrivacyMutation,
  useRevokeSessionMutation,
} from '../hooks/use-settings-queries';
import {
  SETTINGS_FIELD_SX,
  SettingsField,
} from '../utils/settings-form-styles';
import type { PrivacySettings } from '../types';

export function SettingsPrivacyPanel({ agentId }: { agentId: string }) {
  const { data, isPending, isError } = usePrivacyQuery(agentId);
  if (isError) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">Erro ao carregar privacidade.</p>
      </Panel>
    );
  }
  if (isPending || !data) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </Panel>
    );
  }
  return <PrivacyForm agentId={agentId} initial={data} />;
}

function PrivacyForm({
  agentId,
  initial,
}: {
  agentId: string;
  initial: PrivacySettings;
}) {
  const putPrivacy = usePutPrivacyMutation();
  const revoke = useRevokeSessionMutation();
  const changePwd = useChangePasswordMutation();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initial.twoFactorEnabled);
  const [sessions, setSessions] = useState(initial.sessions);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSave() {
    try {
      if (newPassword || confirmPassword || currentPassword) {
        if (!currentPassword || newPassword.length < 8) {
          toast.error('Informe senha atual e nova senha (mín. 8 caracteres)');
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error('Confirmação não confere');
          return;
        }
        await changePwd.mutateAsync({ agentId, currentPassword, newPassword });
      }
      const saved = await putPrivacy.mutateAsync({ agentId, twoFactorEnabled });
      setSessions(saved.sessions);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Preferências salvas');
    } catch {
      toast.error('Não foi possível salvar');
    }
  }

  function handleRevoke(sessionId: string) {
    revoke.mutate(
      { agentId, sessionId },
      {
        onSuccess: (saved) => {
          setSessions(saved.sessions);
          toast.success('Sessão encerrada');
        },
        onError: () => toast.error('Não foi possível encerrar a sessão'),
      },
    );
  }

  return (
    <Panel className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Privacidade e segurança
        </h2>
      </header>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Alterar senha</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsField label="Senha atual" htmlFor="pwd-current">
            <PasswordInput
              id="pwd-current"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              sx={SETTINGS_FIELD_SX}
            />
          </SettingsField>
          <SettingsField label="Nova senha" htmlFor="pwd-new">
            <PasswordInput
              id="pwd-new"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              sx={SETTINGS_FIELD_SX}
            />
          </SettingsField>
          <SettingsField label="Confirmar" htmlFor="pwd-confirm">
            <PasswordInput
              id="pwd-confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              sx={SETTINGS_FIELD_SX}
            />
          </SettingsField>
        </div>
      </section>

      <section className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Autenticação em duas etapas</p>
        </div>
        <Switch
          checked={twoFactorEnabled}
          onChange={(e) => setTwoFactorEnabled(e.target.checked)}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Sessões ativas</h3>
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-3"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-secondary">
                <DevicesOutlinedIcon sx={{ fontSize: 20 }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {session.device}
                  {session.isCurrent ? (
                    <span className="ml-2 text-xs text-primary">Atual</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.location} · {session.lastActive}
                </p>
              </div>
              {!session.isCurrent ? (
                <IconButton size="small" onClick={() => handleRevoke(session.id)}>
                  <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <Button variant="contained" className="h-11 rounded-3xl px-8" onClick={handleSave}>
        Salvar alterações
      </Button>
    </Panel>
  );
}
