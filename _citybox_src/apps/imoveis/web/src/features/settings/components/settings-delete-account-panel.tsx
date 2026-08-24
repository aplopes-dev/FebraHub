'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Button, Input } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { Panel } from '@/components/ui/panel';
import { useDeleteTeamMemberMutation } from '../hooks/use-settings-queries';
import {
  SETTINGS_FIELD_SX,
  SettingsField,
} from '../utils/settings-form-styles';

const CONFIRM_WORD = 'EXCLUIR';

export function SettingsDeleteAccountPanel({ agentId }: { agentId: string }) {
  const router = useRouter();
  const deleteMember = useDeleteTeamMemberMutation();
  const [confirmText, setConfirmText] = useState('');

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  function handleDelete() {
    if (!canDelete) {
      toast.error(`Digite ${CONFIRM_WORD} para confirmar`);
      return;
    }
    deleteMember.mutate(agentId, {
      onSuccess: () => {
        toast.success('Conta excluída');
        setConfirmText('');
        router.push('/');
      },
      onError: () => toast.error('Não foi possível excluir a conta'),
    });
  }

  return (
    <Panel className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-danger">Excluir conta</h2>
        <p className="text-sm text-muted-foreground">
          Esta ação é irreversível. Seus dados de perfil e acesso serão removidos.
        </p>
      </header>

      <div className="flex gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3">
        <WarningAmberOutlinedIcon className="mt-0.5 size-5 shrink-0 text-danger" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">Antes de continuar</p>
          <ul className="list-inside list-disc text-muted-foreground">
            <li>Leads e imóveis vinculados podem ficar sem responsável</li>
            <li>Documentos e preferências desta conta serão apagados</li>
          </ul>
        </div>
      </div>

      <SettingsField label={`Digite ${CONFIRM_WORD} para confirmar`} htmlFor="settings-delete-confirm">
        <Input
          id="settings-delete-confirm"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder={CONFIRM_WORD}
          autoComplete="off"
          fullWidth
          sx={SETTINGS_FIELD_SX}
        />
      </SettingsField>

      <div className="border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="contained"
          color="error"
          className="h-11 rounded-3xl px-8"
          disabled={!canDelete || deleteMember.isPending}
          onClick={handleDelete}
        >
          Excluir minha conta
        </Button>
      </div>
    </Panel>
  );
}
