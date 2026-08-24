'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { EmptyState, ConfirmDialog } from '@citybox/ui/organisms';
import {
  TeamMemberCredentialsDialog,
  useTeamMembers,
  type ProvisionalCredentials,
  type TeamMember,
} from '@/features/shared/team';
import { Can, useCan } from '@/features/clinic/permissions';
import { useStore } from '@/lib/store-context';
import { toastClinicaMutationError } from '@/features/clinic/shared/api';
import { saveServiceHours } from '../services/service-hours.service';
import { saveCommissionRules } from '../services/commission-rules.service';
import { showsServiceHoursTabForApiRole } from '../lib/team-role-bridge';
import type { TeamMemberSubmitPayload } from '../types/team-invite';
import { TeamGridSkeleton } from '../components/team-grid-skeleton';
import { TeamMemberCard } from '../components/team-member-card';
import { TeamMemberSheet } from '../components/team-member-sheet';
import { TeamMemberStatusDialog } from '../components/team-member-status-dialog';
import { TeamStatusFilter } from '../components/team-status-filter';
import { filterTeamMembersByStatus } from '../lib/team-members-filter';
import { resolveClinicTeamMemberStatus } from '../lib/clinic-team-member-status';
import { getTeamMemberStatusToggleMode } from '../lib/team-member-status-toggle';
import {
  DEFAULT_TEAM_MEMBER_STATUS_FILTER,
  type TeamMemberStatusFilter,
} from '../lib/team-status-filter';

/** Aba "Equipe" das Configurações — gestão de membros da clínica. */
export function EquipeSettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { storeId } = useStore();
  const canUpdateTeam = useCan('update', 'Team');
  const {
    members,
    roles,
    isLoading,
    isError,
    isSubmitting,
    isResettingPassword,
    createMember,
    updateMember,
    setMemberStatus,
    resetPassword,
    removeMember,
    isRemoving,
  } = useTeamMembers();

  const [statusFilter, setStatusFilter] = useState<TeamMemberStatusFilter>(
    DEFAULT_TEAM_MEMBER_STATUS_FILTER,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [sheetInitialTab, setSheetInitialTab] = useState<string | undefined>(undefined);
  const [statusToggleMember, setStatusToggleMember] = useState<TeamMember | null>(null);
  const [memberToReset, setMemberToReset] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [credentials, setCredentials] = useState<ProvisionalCredentials | null>(null);

  const filteredMembers = useMemo(
    () => filterTeamMembersByStatus(members, statusFilter),
    [members, statusFilter],
  );

  // Deep-link: /equipe?memberId=…&tab=commission (ex.: Financeiro → Configurar)
  useEffect(() => {
    if (isLoading || !canUpdateTeam) return;

    const memberId = searchParams.get('memberId');
    if (!memberId) return;

    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const tab = searchParams.get('tab') ?? undefined;
    setEditingMember(member);
    setSheetInitialTab(tab);
    setSheetOpen(true);
    router.replace(pathname, { scroll: false });
  }, [canUpdateTeam, isLoading, members, pathname, router, searchParams]);

  const handleOpenCreateSheet = useCallback(() => {
    setEditingMember(null);
    setSheetInitialTab(undefined);
    setSheetOpen(true);
  }, []);

  const handleEdit = useCallback(
    (member: TeamMember) => {
      if (!canUpdateTeam) return;
      setEditingMember(member);
      setSheetInitialTab(undefined);
      setSheetOpen(true);
    },
    [canUpdateTeam],
  );

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setEditingMember(null);
      setSheetInitialTab(undefined);
    }
  }, []);

  const handleSubmit = async ({
    member,
    serviceHours,
    commissionRules,
  }: TeamMemberSubmitPayload) => {
    const shouldSaveServiceHours =
      Boolean(serviceHours) && showsServiceHoursTabForApiRole(member.role);
    const shouldSaveCommissionRules = commissionRules !== undefined && Boolean(storeId);
    const memberDisplayName = `${member.firstName} ${member.lastName}`.trim();

    if (editingMember) {
      await updateMember(editingMember.id, member);

      if (shouldSaveServiceHours && storeId) {
        try {
          await saveServiceHours(storeId, editingMember.id, serviceHours!);
        } catch (error) {
          toastClinicaMutationError(
            error,
            'Membro atualizado, mas os horários de atendimento não foram salvos.',
          );
          throw error;
        }
      }

      if (shouldSaveCommissionRules && storeId) {
        try {
          await saveCommissionRules(
            storeId,
            editingMember.id,
            memberDisplayName,
            commissionRules!,
          );
        } catch (error) {
          toastClinicaMutationError(
            error,
            'Membro atualizado, mas as regras de comissão não foram salvas.',
          );
          throw error;
        }
      }
      return;
    }

    const created = await createMember(member);

    if (shouldSaveServiceHours && storeId) {
      try {
        await saveServiceHours(storeId, created.member.id, serviceHours!);
      } catch (error) {
        toastClinicaMutationError(
          error,
          'Membro criado, mas os horários de atendimento não foram salvos.',
        );
        throw error;
      }
    }

    if (shouldSaveCommissionRules && storeId) {
      try {
        await saveCommissionRules(
          storeId,
          created.member.id,
          created.member.name || memberDisplayName,
          commissionRules!,
        );
      } catch (error) {
        toastClinicaMutationError(
          error,
          'Membro criado, mas as regras de comissão não foram salvas.',
        );
        throw error;
      }
    }

    if (created.temporaryPassword) {
      setCredentials({
        username: created.member.username,
        password: created.temporaryPassword,
      });
    }
  };

  const handleStatusDialogOpenChange = useCallback((open: boolean) => {
    if (!open && !isTogglingStatus) {
      setStatusToggleMember(null);
    }
  }, [isTogglingStatus]);

  const handleConfirmStatusToggle = useCallback(async () => {
    if (!statusToggleMember) {
      return;
    }

    const clinicStatus = resolveClinicTeamMemberStatus(statusToggleMember);
    const mode = getTeamMemberStatusToggleMode(clinicStatus);
    setIsTogglingStatus(true);

    try {
      if (mode === 'deactivate') {
        await setMemberStatus(statusToggleMember.id, 'inactive');
      } else if (clinicStatus === 'inactive') {
        await setMemberStatus(statusToggleMember.id, 'active');
      } else {
        const result = await resetPassword(statusToggleMember.id);
        setCredentials({
          username: result.username,
          password: result.temporaryPassword,
        });
      }
      setStatusToggleMember(null);
    } catch {
      // O hook já exibe o toast de erro.
    } finally {
      setIsTogglingStatus(false);
    }
  }, [setMemberStatus, resetPassword, statusToggleMember]);

  const handleConfirmReset = async () => {
    if (!memberToReset) return;
    try {
      const result = await resetPassword(memberToReset.id);
      setMemberToReset(null);
      setCredentials({
        username: result.username,
        password: result.temporaryPassword,
      });
    } catch {
      // O hook já exibe o toast de erro.
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember(memberToRemove.id);
      setMemberToRemove(null);
    } catch {
      // O hook já exibe o toast de erro.
    }
  };

  return (
    <>
      <div className="space-y-5 rounded-xl border border-border/60 bg-background p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TeamStatusFilter value={statusFilter} onChange={setStatusFilter} />

          <Can action="create" subject="Team">
            <Button type="button" onClick={handleOpenCreateSheet}>
              <UserPlus className="mr-2 size-4" aria-hidden />
              Adicionar membro
            </Button>
          </Can>
        </div>

        {isLoading ? (
          <TeamGridSkeleton />
        ) : isError ? (
          <EmptyState
            icon={<Users className="size-8" aria-hidden />}
            title="Não foi possível carregar a equipe"
            description="Tente novamente em instantes. Se o problema continuar, recarregue a página."
            className="py-12"
          />
        ) : filteredMembers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onEdit={handleEdit}
                onResetPassword={setMemberToReset}
                onToggleStatus={setStatusToggleMember}
                onRemove={setMemberToRemove}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="size-8" aria-hidden />}
            title={
              members.length === 0
                ? 'Nenhum membro cadastrado'
                : 'Nenhum membro neste filtro'
            }
            description={
              members.length === 0
                ? 'Ainda não há membros nesta clínica.'
                : 'Altere o filtro "Exibir" para ver outros membros da equipe.'
            }
            className="py-12"
          />
        )}
      </div>

      <TeamMemberSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        editingMember={editingMember}
        initialTab={sheetInitialTab}
        roles={roles}
        isRolesLoading={isLoading}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <TeamMemberCredentialsDialog
        credentials={credentials}
        onOpenChange={() => setCredentials(null)}
      />

      <TeamMemberStatusDialog
        member={statusToggleMember}
        open={statusToggleMember !== null}
        isConfirming={isTogglingStatus || isResettingPassword}
        onOpenChange={handleStatusDialogOpenChange}
        onConfirm={() => void handleConfirmStatusToggle()}
      />

      <ConfirmDialog
        open={memberToReset !== null}
        onOpenChange={(open) => {
          if (!open) setMemberToReset(null);
        }}
        title="Gerar nova senha?"
        description={
          memberToReset ? (
            <>
              Uma nova senha provisória será gerada para{' '}
              <strong>{memberToReset.name}</strong>. A senha atual deixará de
              funcionar e o membro precisará definir uma nova no próximo acesso.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Gerar nova senha"
        cancelLabel="Cancelar"
        isConfirming={isResettingPassword}
        onConfirm={handleConfirmReset}
      />

      <ConfirmDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setMemberToRemove(null);
        }}
        title="Remover membro de demonstração?"
        description={
          memberToRemove ? (
            <>
              <strong>{memberToRemove.name}</strong> será removido da equipe. Esta
              conta foi criada apenas para demonstração e não poderá ser recuperada.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Remover"
        confirmVariant="destructive"
        cancelLabel="Cancelar"
        isConfirming={isRemoving}
        onConfirm={() => void handleConfirmRemove()}
      />
    </>
  );
}
