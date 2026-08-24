'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tab,
  Tabs,
  Divider,
  Skeleton,
} from '@citybox/mui/atoms';
import { Drawer, FormField, MultiSelect } from '@citybox/mui/molecules';
import CircularProgress from '@mui/material/CircularProgress';
import type { PermissionModule } from '@citybox/beautiful-permissions';
import { formatPhoneBR, digitsOnly } from '@/lib/field-masks';
import { createEmptyWeekSchedule, type WeekSchedule } from '@/lib/work-schedule';
import { useServicesQuery } from '@/features/catalog/hooks/use-catalog-queries';
import {
  createPermissionMapForRole,
  createPermissionMapFromIds,
  permissionIdsFromMap,
} from '@/features/permissions';
import {
  useMemberByIdQuery,
  useMemberRolesQuery,
} from '../hooks/use-members-queries';
import type {
  CreateMemberFormData,
  UpdateMemberFormData,
} from '../types/member.types';
import { isSchedulableRole } from '../types/member.types';
import { suggestUsernameFromName } from '../lib/member-ui';
import {
  WorkScheduleEditor,
  validateWeekSchedule,
} from './work-schedule-editor';
import { MemberPermissionsPanel } from './member-permissions-panel';

const DEFAULT_ROLE = 'profissional';
const DRAWER_WIDTH = 800;

type MemberCreateProps = {
  mode: 'create';
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMemberFormData) => void;
  isSubmitting?: boolean;
  defaultRole?: string | null;
  memberId?: null;
};

type MemberEditProps = {
  mode: 'edit';
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateMemberFormData) => void;
  memberId: string | null;
  isSubmitting?: boolean;
  defaultRole?: null;
};

export type MemberDrawerProps = MemberCreateProps | MemberEditProps;

type FormContentProps = MemberDrawerProps & {
  isSubmitting: boolean;
  onRenderFooter?: (footer: ReactNode) => void;
};

function MemberDrawerContent(props: FormContentProps) {
  const { mode, open, onClose, onSubmit, isSubmitting, defaultRole, memberId, onRenderFooter } = props;
  const isEdit = mode === 'edit';

  const { data: servicesPage, isPending: loadingServices } = useServicesQuery({
    active: true,
    perPage: 100,
  });
  const services = servicesPage?.data ?? [];
  const { data: roles = [], isPending: rolesLoading } = useMemberRolesQuery();

  const {
    data: detail,
    isPending: loadingDetail,
    isError: detailError,
  } = useMemberByIdQuery(isEdit ? memberId : null);

  const usernameManuallyEdited = useRef(false);
  const [activeTab, setActiveTab] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(defaultRole || DEFAULT_ROLE);
  const [permissionValues, setPermissionValues] = useState<
    Record<string, boolean>
  >(() => createPermissionMapForRole(defaultRole || DEFAULT_ROLE));
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [week, setWeek] = useState<WeekSchedule>(() => createEmptyWeekSchedule());
  const [detailReady, setDetailReady] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scheduleValidationError, setScheduleValidationError] = useState<
    string | null
  >(null);

  const roleOptions = useMemo(() => {
    const all =
      roles.length > 0
        ? roles
        : [
            { id: 'profissional', label: 'Profissional' },
            { id: 'recepcao', label: 'Recepção' },
            { id: 'gerente', label: 'Gerente' },
          ];
    if (isEdit && role && !all.some((opt) => opt.id === role)) {
      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
      return [...all, { id: role, label: `${roleLabel} (legado)` }];
    }
    return all;
  }, [roles, isEdit, role]);

  const serviceOptions = services.map((service) => ({
    label: service.name,
    value: service.id,
  }));

  // Reset em modo criação ao abrir
  useEffect(() => {
    if (isEdit || !open) return;
    usernameManuallyEdited.current = false;
    const nextRole = defaultRole || DEFAULT_ROLE;
    setActiveTab(0);
    setFirstName('');
    setLastName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setRole(nextRole);
    setPermissionValues(createPermissionMapForRole(nextRole));
    setServiceIds([]);
    setWeek(createEmptyWeekSchedule());
    setErrors({});
    setScheduleValidationError(null);
  }, [open, isEdit, defaultRole]);

  // Sugestão automática de username a partir de nome e sobrenome
  useEffect(() => {
    if (!open || isEdit || usernameManuallyEdited.current) return;
    const suggested = suggestUsernameFromName(firstName, lastName);
    setUsername(suggested);
  }, [open, isEdit, firstName, lastName]);

  // Popula formulário em modo edição quando os dados chegam
  useEffect(() => {
    if (!isEdit || !detail) return;
    const storeRole = detail.stores[0]?.role ?? 'profissional';
    const storePermissions = detail.stores[0]?.permissions ?? [];
    setActiveTab(0);
    setFirstName(detail.firstName);
    setLastName(detail.lastName);
    setUsername(detail.username ?? '');
    setEmail(detail.email ?? '');
    setPhone(detail.phone ? formatPhoneBR(detail.phone) : '');
    setRole(storeRole);
    setPermissionValues(
      storePermissions.length > 0
        ? createPermissionMapFromIds(storePermissions)
        : createPermissionMapForRole(storeRole),
    );
    setServiceIds(detail.serviceIds);
    setWeek(detail.week);
    setDetailReady(true);
    setErrors({});
    setScheduleValidationError(null);
  }, [isEdit, detail]);

  const schedulable = isSchedulableRole(role);
  const showLoading = isEdit && (loadingDetail || !detailReady);
  const showLoadError = isEdit && detailError && !loadingDetail;
  const formBlocked = showLoading || showLoadError || isSubmitting;

  const handleRoleChange = (nextRole: string) => {
    setRole(nextRole);
    setPermissionValues(createPermissionMapForRole(nextRole));
    setScheduleValidationError(null);
    if (!isSchedulableRole(nextRole)) {
      setActiveTab(0);
    }
  };

  const handleToggle = (permissionId: string, granted: boolean) => {
    setPermissionValues((prev) => ({ ...prev, [permissionId]: granted }));
  };

  const handleToggleModule = (module: PermissionModule, granted: boolean) => {
    setPermissionValues((prev) => {
      const next = { ...prev };
      for (const permission of module.permissions) {
        next[permission.id] = granted;
      }
      return next;
    });
  };

  const handleWeekChange = (next: WeekSchedule) => {
    setWeek(next);
    setScheduleValidationError(null);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'Informe o nome.';
    if (!lastName.trim()) next.lastName = 'Informe o sobrenome.';

    if (!isEdit) {
      const user = username.trim().toLowerCase();
      if (user.length < 2) {
        next.username = 'Informe um usuário com pelo menos 2 caracteres.';
      } else if (!/^[a-z0-9._-]+$/.test(user)) {
        next.username =
          'Use apenas letras minúsculas, números, ponto, hífen ou underscore.';
      }
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Informe um e-mail válido.';
    }

    if (isEdit && phone.trim()) {
      const phoneDigits = digitsOnly(phone);
      if (phoneDigits.length < 10) {
        next.phone =
          'Informe um telefone válido com DDD (mínimo 10 dígitos) ou deixe em branco.';
      }
    }

    if (!role) next.role = 'Selecione o papel na loja.';

    let weekError: string | null = null;
    if (schedulable) {
      weekError = validateWeekSchedule(week);
      setScheduleValidationError(weekError);
    } else {
      setScheduleValidationError(null);
    }

    setErrors(next);
    return Object.keys(next).length === 0 && !weekError;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (isEdit) {
      const isOwner = detail?.isOrganizationOwner === true;
      const payload: UpdateMemberFormData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        role,
      };
      if (!isOwner) {
        payload.permissions = permissionIdsFromMap(permissionValues);
      }
      if (schedulable) {
        payload.serviceIds = serviceIds;
        payload.week = week;
      }
      (onSubmit as (data: UpdateMemberFormData) => void)(payload);
    } else {
      const payload: CreateMemberFormData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        permissions: permissionIdsFromMap(permissionValues),
      };
      if (schedulable) {
        payload.serviceIds = serviceIds;
        payload.week = week;
      }
      (onSubmit as (data: CreateMemberFormData) => void)(payload);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  useEffect(() => {
    onRenderFooter?.(
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ justifyContent: 'flex-end' }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleClose}
          disabled={formBlocked}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={formBlocked}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : undefined
          }
        >
          {isSubmitting
            ? isEdit
              ? 'Salvando…'
              : 'Convidando…'
            : isEdit
            ? 'Salvar alterações'
            : 'Adicionar membro'}
        </Button>
      </Stack>
    );
  });

  if (showLoading) {
    return (
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
        </Stack>
        <Skeleton variant="rounded" height={56} />
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
        </Stack>
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={280} />
      </Stack>
    );
  }

  if (showLoadError) {
    return (
      <Alert severity="error">
        Não foi possível carregar os dados deste membro. Feche e tente novamente.
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5}>
      {/* ── Dados pessoais ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormField
          label="Nome *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={Boolean(errors.firstName)}
          errorMessage={errors.firstName}
          fullWidth
          autoFocus
          disabled={formBlocked}
        />
        <FormField
          label="Sobrenome *"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          error={Boolean(errors.lastName)}
          errorMessage={errors.lastName}
          fullWidth
          disabled={formBlocked}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormField
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(errors.email)}
          errorMessage={errors.email}
          helperText={!isEdit ? 'Opcional — recomendado para recuperação de acesso.' : undefined}
          fullWidth
          disabled={formBlocked}
        />
        <FormField
          label={isEdit ? 'Nome de usuário' : 'Usuário de login *'}
          placeholder={!isEdit ? 'ex: maria.silva' : undefined}
          value={username}
          onChange={(e) => {
            usernameManuallyEdited.current = true;
            setUsername(e.target.value.toLowerCase());
          }}
          error={Boolean(errors.username)}
          errorMessage={errors.username}
          disabled={isEdit || formBlocked}
          helperText={
            isEdit
              ? 'Definido no convite — não pode ser alterado.'
              : 'Sugerido automaticamente a partir do nome.'
          }
          fullWidth
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormField
          label={isEdit ? 'Telefone / WhatsApp' : 'Telefone'}
          value={phone}
          onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
          error={Boolean(errors.phone)}
          errorMessage={errors.phone}
          helperText={!isEdit ? 'Opcional.' : undefined}
          fullWidth
          disabled={formBlocked}
        />
        <FormControl
          fullWidth
          error={Boolean(errors.role)}
          disabled={rolesLoading || formBlocked}
        >
          <InputLabel id="member-role-label">Papel na loja *</InputLabel>
          <Select
            labelId="member-role-label"
            label="Papel na loja *"
            value={role}
            onChange={(e) => handleRoleChange(String(e.target.value))}
          >
            {roleOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {errors.role ? (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {errors.role}
            </Typography>
          ) : null}
        </FormControl>
      </Stack>

      {/* Aviso de senha provisória apenas na criação */}
      {!isEdit ? (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            Uma senha provisória será gerada ao adicionar o membro. Ela é exibida
            uma única vez — no primeiro acesso, o sistema solicita a definição de
            uma nova senha.
          </Typography>
        </Alert>
      ) : null}

      {/* ── Tabs: Serviços/Horário + Permissões ── */}
      <Box>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 0,
              mr: 3,
              minWidth: 'auto',
            },
          }}
        >
          {schedulable ? <Tab label="Serviços e Horário" /> : null}
          <Tab label="Permissões" />
        </Tabs>

        {/* ── Tab Content: Serviços e Horário ── */}
        {schedulable && activeTab === 0 ? (
          <Stack spacing={2.5} sx={{ pt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Serviços prestados
              </Typography>
              <MultiSelect
                options={serviceOptions}
                value={serviceIds}
                onChange={setServiceIds}
                placeholder={
                  loadingServices
                    ? 'Carregando serviços…'
                    : 'Selecione os serviços'
                }
                disabled={loadingServices || formBlocked}
              />
            </Box>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Horário de trabalho
            </Typography>
            <WorkScheduleEditor
              week={week}
              onChange={handleWeekChange}
              validationError={scheduleValidationError}
              disabled={formBlocked}
            />
          </Stack>
        ) : null}

        {/* ── Tab Content: Permissões ── */}
        {(schedulable ? activeTab === 1 : activeTab === 0) ? (
          <Stack spacing={2} sx={{ pt: 2 }}>
            {detail?.isOrganizationOwner === true ? (
              <Alert severity="info">
                As permissões do responsável não podem ser alteradas. O
                responsável tem sempre todas as permissões habilitadas.
              </Alert>
            ) : null}
            <MemberPermissionsPanel
              permissionValues={permissionValues}
              disabled={formBlocked || detail?.isOrganizationOwner === true}
              onToggle={handleToggle}
              onToggleModule={handleToggleModule}
            />
          </Stack>
        ) : null}
      </Box>
    </Stack>
  );
}

/**
 * Drawer lateral centralizado para criação e edição de membros da equipe.
 */
export function MemberDrawer(props: MemberDrawerProps) {
  const { open, onClose, isSubmitting = false, mode, memberId } = props;
  const [footerNode, setFooterNode] = useState<ReactNode>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const title = mode === 'edit' ? 'Editar membro' : 'Novo membro';

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={title}
      footer={footerNode}
      width={DRAWER_WIDTH}
      anchor="right"
    >
      {open && (mode === 'create' || (mode === 'edit' && Boolean(memberId))) ? (
        <MemberDrawerContent
          {...props}
          isSubmitting={isSubmitting}
          onRenderFooter={setFooterNode}
        />
      ) : null}
    </Drawer>
  );
}

/** Componentes utilitários de conveniência */
export function MemberCreateDrawer(
  props: Omit<MemberCreateProps, 'mode'>,
) {
  return <MemberDrawer mode="create" {...props} />;
}

export function MemberEditDrawer(
  props: Omit<MemberEditProps, 'mode'>,
) {
  return <MemberDrawer mode="edit" {...props} />;
}
