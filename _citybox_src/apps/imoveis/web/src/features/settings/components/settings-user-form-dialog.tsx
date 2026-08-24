'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Box,
  Input,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from '@citybox/mui/atoms';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalTitle,
} from '@/components/ui/modal';
import { toast } from '@citybox/mui/molecules';
import { ImoveisApiError } from '@/lib/imoveis-api';
import { formatPhoneBR } from '@/features/leads/utils/field-masks';
import {
  defaultPermissionsForRole,
} from '../services/settings-service';
import {
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  type CreateUserResult,
} from '../hooks/use-settings-queries';
import {
  PERMISSION_KEYS,
  PERMISSION_LABEL,
  USER_ROLE_LABEL,
  type PermissionKey,
  type TeamUser,
  type UserPermissions,
  type UserRole,
} from '../types';
import {
  SETTINGS_MODAL_FIELD_SX,
  SETTINGS_MODAL_SELECT_SX,
} from '../utils/settings-form-styles';

const USER_ROLES = Object.keys(USER_ROLE_LABEL) as UserRole[];

type FormState = {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  permissions: UserPermissions;
};

type SettingsUserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  user?: TeamUser | null;
  onSaved: (created?: CreateUserResult) => void;
};

function toFormState(user?: TeamUser | null): FormState {
  if (!user) {
    const role: UserRole = 'broker';
    return {
      name: '',
      email: '',
      phone: '',
      role,
      active: true,
      permissions: defaultPermissionsForRole(role),
    };
  }
  return {
    name: user.name,
    email: user.email,
    phone: formatPhoneBR(user.phone),
    role: user.role,
    active: user.active,
    permissions: { ...user.permissions },
  };
}

function PermissionToggle({
  permission,
  checked,
  onCheckedChange,
}: {
  permission: PermissionKey;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{PERMISSION_LABEL[permission]}</p>
      </div>
      <Switch
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
    </div>
  );
}

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

export function SettingsUserFormDialog({
  open,
  onOpenChange,
  mode,
  user,
  onSaved,
}: SettingsUserFormDialogProps) {
  const createMember = useCreateTeamMemberMutation();
  const updateMember = useUpdateTeamMemberMutation();
  const [form, setForm] = useState<FormState>(() => toFormState(user));

  useEffect(() => {
    if (open) {
      setForm(toFormState(user));
    }
  }, [open, user]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePermission(key: PermissionKey, enabled: boolean) {
    setForm((current) => ({
      ...current,
      permissions: { ...current.permissions, [key]: enabled },
    }));
  }

  function handleRoleChange(role: UserRole) {
    setForm((current) => ({
      ...current,
      role,
      permissions: defaultPermissionsForRole(role),
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error('Informe o nome do usuário');
      return;
    }
    if (!form.email.trim()) {
      toast.error('Informe o e-mail');
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      active: form.active,
      permissions: form.permissions,
    };

    try {
      if (mode === 'create') {
        const result = await createMember.mutateAsync(payload);
        toast.success(
          result.credentials.temporaryPassword
            ? `Usuário criado. Senha provisória: ${result.credentials.temporaryPassword}`
            : 'Usuário criado',
        );
        onSaved(result);
      } else if (user) {
        await updateMember.mutateAsync({ agentId: user.id, input: payload });
        toast.success('Usuário atualizado');
        onSaved();
      }
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ImoveisApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : null;
      toast.error(message || 'Não foi possível salvar o usuário');
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            maxHeight: '90vh',
            overflowY: 'auto',
          },
        },
      }}
    >
      <ModalTitle>
        {mode === 'create' ? 'Novo usuário' : 'Editar usuário'}
      </ModalTitle>

      <ModalContent>
        <div className="space-y-5">
          <ModalField label="Nome" htmlFor="settings-user-name">
            <Input
              id="settings-user-name"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Nome completo"
              fullWidth
              sx={SETTINGS_MODAL_FIELD_SX}
            />
          </ModalField>

          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="E-mail" htmlFor="settings-user-email">
              <Input
                id="settings-user-email"
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="email@imobiliaria.com.br"
                fullWidth
                sx={SETTINGS_MODAL_FIELD_SX}
              />
            </ModalField>
            <ModalField label="Telefone" htmlFor="settings-user-phone">
              <Input
                id="settings-user-phone"
                value={form.phone}
                onChange={(event) => update('phone', formatPhoneBR(event.target.value))}
                placeholder="(00) 00000-0000"
                fullWidth
                sx={SETTINGS_MODAL_FIELD_SX}
              />
            </ModalField>
          </div>

          <ModalField label="Papel" htmlFor="settings-user-role">
            <Select
              id="settings-user-role"
              value={form.role}
              onChange={(event) => handleRoleChange(event.target.value as UserRole)}
              displayEmpty
              fullWidth
              size="small"
              sx={SETTINGS_MODAL_SELECT_SX}
            >
              {USER_ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {USER_ROLE_LABEL[role]}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Ao trocar o papel, as permissões são ajustadas ao padrão do cargo. Você pode
              habilitar ou desabilitar cada uma abaixo.
            </Typography>
          </ModalField>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Usuário ativo</p>
              <p className="text-xs text-muted-foreground">
                Usuários inativos não conseguem acessar o painel.
              </p>
            </div>
            <Switch
              checked={form.active}
              onChange={(event) => update('active', event.target.checked)}
            />
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold tracking-tight">Permissões</h3>
            {PERMISSION_KEYS.map((permission) => (
              <PermissionToggle
                key={permission}
                permission={permission}
                checked={form.permissions[permission]}
                onCheckedChange={(checked) => updatePermission(permission, checked)}
              />
            ))}
          </section>
        </div>
      </ModalContent>

      <ModalActions className="gap-2 sm:justify-end">
        <ModalCancelButton type="button" onClick={() => onOpenChange(false)}>
          Cancelar
        </ModalCancelButton>
        <ModalConfirmButton type="button" onClick={handleSubmit}>
          {mode === 'create' ? 'Criar usuário' : 'Salvar alterações'}
        </ModalConfirmButton>
      </ModalActions>
    </Modal>
  );
}
