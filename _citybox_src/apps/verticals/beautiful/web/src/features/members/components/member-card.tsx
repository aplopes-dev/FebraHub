'use client';

import type { Theme } from '@mui/material/styles';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@citybox/mui/atoms';
import { Icon } from '@citybox/mui/icons';
import { useCan, getMemberPermissionSummary } from '@/features/permissions';
import type { StoreMember } from '../types/member.types';
import { isSchedulableRole } from '../types/member.types';
import {
  getMemberInitials,
  isOrganizationOwnerMember,
  memberPermissions,
  memberRole,
  memberRoleLabel,
} from '../lib/member-ui';

const mutedSx = {
  fontSize: '0.75rem',
  color: (theme: Theme) =>
    theme.palette.mode === 'dark' ? 'oklch(0.708 0 0)' : 'oklch(0.556 0 0)',
};

const mutedTextSx = {
  color: (theme: Theme) =>
    theme.palette.mode === 'dark' ? 'oklch(0.708 0 0)' : 'oklch(0.556 0 0)',
};

type MemberCardProps = {
  member: StoreMember;
  onEdit?: (member: StoreMember) => void;
  onResetPassword?: (member: StoreMember) => void;
  onToggleStatus?: (member: StoreMember) => void;
};

export function MemberCard({
  member,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: MemberCardProps) {
  const canUpdate = useCan('update', 'Team');
  const canInactivate = useCan('delete', 'Team');
  const permissions = memberPermissions(member);
  const summary = getMemberPermissionSummary(permissions);
  const role = memberRole(member);
  const isActive = member.status === 'active';
  const isOrganizationOwner = isOrganizationOwnerMember(member);
  const showStatusToggle = canInactivate && !isOrganizationOwner;
  const showActions = canUpdate || showStatusToggle;
  const serviceLabels = (member.services || []).map((service) => service.name).filter(Boolean);

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: 1 },
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            aria-hidden
            sx={{
              width: 44,
              height: 44,
              bgcolor: 'background.paper',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: (theme) =>
                theme.palette.mode === 'dark' ? 'oklch(0.708 0 0)' : 'oklch(0.556 0 0)',
            }}
          >
            {getMemberInitials(member.name)}
          </Avatar>
        }
        title={
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {member.name}
          </Typography>
        }
        subheader={
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Icon name="user" size={12} sx={mutedSx} />
              <Typography noWrap variant="caption" sx={mutedSx}>
                {member.username}
              </Typography>
            </Stack>
            {member.email ? (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Icon name="mail" size={12} sx={mutedSx} />
                <Typography noWrap variant="caption" sx={mutedSx}>
                  {member.email}
                </Typography>
              </Stack>
            ) : null}
          </Stack>
        }
        sx={{
          alignItems: 'flex-start',
          bgcolor: 'action.hover',
          '& .MuiCardHeader-content': { minWidth: 0 },
        }}
      />

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Icon name="user" size={16} sx={mutedSx} />
          <Typography variant="body2" noWrap>
            {memberRoleLabel(member)}
          </Typography>
          {isOrganizationOwner ? (
            <Badge
              size="small"
              variant="outlined"
              label="Responsável"
              color="primary"
              sx={{ width: 'fit-content', fontSize: '0.625rem', height: 22 }}
            />
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Icon name="checklist" size={16} sx={mutedSx} />
          <Typography variant="body2" sx={mutedTextSx}>
            {summary.granted} de {summary.total} permissões
          </Typography>
        </Stack>

        {isSchedulableRole(role) && serviceLabels.length > 0 ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <Icon name="tag" size={16} sx={{ ...mutedSx, mt: 0.25 }} />
            <Typography variant="body2" sx={mutedTextSx}>
              {serviceLabels.slice(0, 2).join(', ')}
              {serviceLabels.length > 2 ? ` +${serviceLabels.length - 2}` : ''}
            </Typography>
          </Stack>
        ) : null}

        <Badge
          size="small"
          variant="outlined"
          label={isActive ? 'Ativo' : 'Inativo'}
          color={isActive ? 'success' : 'default'}
          sx={{ width: 'fit-content', fontSize: '0.625rem', height: 22 }}
        />
      </CardContent>

      {showActions ? (
        <CardActions sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', gap: 1 }}>
          {canUpdate ? (
            <Tooltip title="Editar membro">
              <Button
                type="button"
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Icon name="edit" size={16} />}
                onClick={() => onEdit?.(member)}
              >
                Editar
              </Button>
            </Tooltip>
          ) : null}

          {canUpdate ? (
            <Tooltip title="Gerar nova senha">
              <IconButton
                size="small"
                aria-label={`Resetar senha de ${member.name}`}
                onClick={() => onResetPassword?.(member)}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Icon name="restore" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}

          {showStatusToggle ? (
            <Tooltip title={isActive ? 'Desativar membro' : 'Ativar membro'}>
              <IconButton
                size="small"
                color={isActive ? 'error' : 'success'}
                aria-label={isActive ? `Desativar ${member.name}` : `Ativar ${member.name}`}
                onClick={() => onToggleStatus?.(member)}
                sx={{
                  border: 1,
                  borderColor: isActive ? 'error.light' : 'success.light',
                  borderRadius: 1,
                }}
              >
                {isActive ? <Icon name="close" size={18} /> : <Icon name="check" size={18} />}
              </IconButton>
            </Tooltip>
          ) : null}
        </CardActions>
      ) : null}
    </Card>
  );
}
