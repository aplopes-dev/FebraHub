'use client';

import { useCallback, useMemo, useState } from 'react';
import { Box, Button, Stack } from '@citybox/mui/atoms';
import { EmptyState, toast } from '@citybox/mui/molecules';
import { ConfirmationDialog, PageHeader } from '@citybox/mui/organisms';
import { Icon } from '@citybox/mui/icons';
import { Can, useCan } from '@/features/permissions';
import { BeautifulApiError } from '@/lib/beautiful-api';
import { useStore } from '@/lib/store-context';
import { MemberCard } from '../components/member-card';
import { MemberCredentialsDialog } from '../components/member-credentials-dialog';
import { MemberCreateDrawer, MemberEditDrawer } from '../components/member-drawer';
import { MemberGridSkeleton } from '../components/member-grid-skeleton';
import { MemberStatusDialog } from '../components/member-status-dialog';
import { MemberStatusFilter } from '../components/member-status-filter';
import {
  useCreateMemberMutation,
  useMembersQuery,
  useResetMemberPasswordMutation,
  useUpdateMemberMutation,
} from '../hooks/use-members-queries';
import {
  DEFAULT_MEMBER_STATUS_FILTER,
  type MemberStatusFilter as MemberStatusFilterValue,
} from '../lib/member-status-filter';
import { filterMembersByStatus, isOrganizationOwnerMember } from '../lib/member-ui';
import type { ListMembersParams } from '../services/member-service';
import type {
  CreateMemberFormData,
  MemberProvisionalCredentials,
  StoreMember,
  UpdateMemberFormData,
} from '../types/member.types';

export function MembersPage() {
  const { storeId } = useStore();
  const canUpdateTeam = useCan('update', 'Team');
  const createMutation = useCreateMemberMutation();
  const updateMutation = useUpdateMemberMutation();
  const resetPasswordMutation = useResetMemberPasswordMutation();

  const [statusFilter, setStatusFilter] = useState<MemberStatusFilterValue>(
    DEFAULT_MEMBER_STATUS_FILTER,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreatingMember, setIsCreatingMember] = useState(false);
  const [created, setCreated] = useState<MemberProvisionalCredentials | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [statusToggleMember, setStatusToggleMember] = useState<StoreMember | null>(null);
  const [memberToReset, setMemberToReset] = useState<StoreMember | null>(null);

  const queryParams = useMemo<ListMembersParams | undefined>(() => {
    if (statusFilter === 'all') return undefined;
    return { status: statusFilter };
  }, [statusFilter]);

  const {
    data: members = [],
    isPending: loading,
    isError,
  } = useMembersQuery(queryParams);

  const filteredMembers = members;

  const handleOpenCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const handleEdit = useCallback(
    (member: StoreMember) => {
      if (!canUpdateTeam) return;
      setEditingMemberId(member.id);
    },
    [canUpdateTeam],
  );

  const handleCreateSubmit = async (payload: CreateMemberFormData) => {
    setIsCreatingMember(true);
    try {
      const member = await createMutation.mutateAsync(payload);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Membro convidado', {
        description: `${member.firstName} foi vinculado(a) à loja ativa.`,
      });
      setCreateOpen(false);
      setCreated({
        username: member.username,
        provisionalPassword: member.provisionalPassword,
        subtitle: `${member.firstName} ${member.lastName} · papel ${member.stores[0]?.roleLabel ?? '—'}`,
      });
    } catch (err) {
      const message =
        err instanceof BeautifulApiError
          ? err.message
          : 'Não foi possível convidar o membro. Tente novamente.';
      toast.error('Falha ao convidar', { description: message });
    } finally {
      setIsCreatingMember(false);
    }
  };

  const handleEditSubmit = (data: UpdateMemberFormData) => {
    if (!editingMemberId) return;
    updateMutation.mutate(
      { id: editingMemberId, data },
      {
        onSuccess: (member) => {
          toast.success('Perfil atualizado', {
            description: `Os dados de ${member.name} foram salvos.`,
          });
          setEditingMemberId(null);
        },
        onError: (err) => {
          const message =
            err instanceof BeautifulApiError
              ? err.message
              : 'Não foi possível salvar. Tente novamente.';
          toast.error('Falha ao salvar', { description: message });
        },
      },
    );
  };

  const handleConfirmStatusToggle = () => {
    if (!statusToggleMember) return;
    if (
      isOrganizationOwnerMember(statusToggleMember) &&
      statusToggleMember.status === 'active'
    ) {
      toast.error('Não é possível desativar o responsável da organização.');
      setStatusToggleMember(null);
      return;
    }
    const nextStatus = statusToggleMember.status === 'active' ? 'disabled' : 'active';

    updateMutation.mutate(
      { id: statusToggleMember.id, data: { status: nextStatus } },
      {
        onSuccess: (member) => {
          toast.success(
            nextStatus === 'disabled' ? 'Membro desativado' : 'Membro ativado',
            { description: member.name },
          );
          setStatusToggleMember(null);
        },
        onError: (err) => {
          const message =
            err instanceof BeautifulApiError
              ? err.message
              : 'Não foi possível atualizar o status. Tente novamente.';
          toast.error('Falha ao atualizar status', { description: message });
        },
      },
    );
  };

  const handleConfirmResetPassword = () => {
    if (!memberToReset) return;
    const target = memberToReset;

    resetPasswordMutation.mutate(target.id, {
      onSuccess: (result) => {
        toast.success('Nova senha provisória gerada.');
        setMemberToReset(null);
        setCreated({
          username: result.username,
          provisionalPassword: result.provisionalPassword,
          title: 'Nova senha provisória',
          subtitle: target.name,
        });
      },
      onError: (err) => {
        const message =
          err instanceof BeautifulApiError
            ? err.message
            : 'Não foi possível gerar a senha. Tente novamente.';
        toast.error('Falha ao gerar senha', { description: message });
      },
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <MemberStatusFilter value={statusFilter} onChange={setStatusFilter} />

          <Can action="create" subject="Team">
            <Button
              variant="contained"
              startIcon={<Icon name="plus" size={18} />}
              onClick={handleOpenCreate}
              disabled={!storeId}
            >
              Adicionar membro
            </Button>
          </Can>
        </Stack>

        {loading ? (
          <MemberGridSkeleton />
        ) : isError ? (
          <EmptyState
            icon={<Icon name="users" size={32} />}
            title="Não foi possível carregar a equipe"
            description="Tente novamente em instantes. Se o problema continuar, recarregue a página."
            sx={{ py: 6 }}
          />
        ) : filteredMembers.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
                xl: 'repeat(4, 1fr)',
              },
            }}
          >
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onEdit={handleEdit}
                onResetPassword={setMemberToReset}
                onToggleStatus={setStatusToggleMember}
              />
            ))}
          </Box>
        ) : (
          <EmptyState
            icon={<Icon name="users" size={32} />}
            title={
              members.length === 0
                ? 'Nenhum membro cadastrado'
                : 'Nenhum membro neste filtro'
            }
            description={
              members.length === 0
                ? 'Ainda não há membros nesta loja.'
                : 'Altere o filtro "Exibir" para ver outros membros da equipe.'
            }
            sx={{ py: 6 }}
          />
        )}
      </Box>

      <Can action="create" subject="Team">
        <MemberCreateDrawer
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateSubmit}
          isSubmitting={createMutation.isPending || isCreatingMember}
        />
      </Can>

      <MemberCredentialsDialog
        open={Boolean(created)}
        credentials={created}
        onClose={() => setCreated(null)}
      />

      <Can action="update" subject="Team">
        <MemberEditDrawer
          open={Boolean(editingMemberId)}
          memberId={editingMemberId}
          onClose={() => setEditingMemberId(null)}
          onSubmit={handleEditSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </Can>

      <MemberStatusDialog
        member={statusToggleMember}
        open={statusToggleMember !== null}
        isConfirming={updateMutation.isPending}
        onCancel={() => {
          if (!updateMutation.isPending) setStatusToggleMember(null);
        }}
        onConfirm={handleConfirmStatusToggle}
      />

      <ConfirmationDialog
        open={memberToReset !== null}
        title="Gerar nova senha?"
        description={
          memberToReset
            ? `Uma nova senha provisória será gerada para ${memberToReset.name}. A senha atual deixará de funcionar e o membro precisará definir uma nova no próximo acesso.`
            : undefined
        }
        confirmLabel="Gerar nova senha"
        cancelLabel="Cancelar"
        loading={resetPasswordMutation.isPending}
        onCancel={() => {
          if (!resetPasswordMutation.isPending) setMemberToReset(null);
        }}
        onConfirm={handleConfirmResetPassword}
      />
    </Box>
  );
}
