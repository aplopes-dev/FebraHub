"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import Stack from "@mui/material/Stack";
import { Button, PageHeader } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { useCurrentUser } from "@/lib/current-user";
import { ActiveSessionsDrawer } from "@/features/users-permissions/components/active-sessions-drawer";
import { UserListTable } from "@/features/users-permissions/components/user-list/user-list-table";
import { UserListTabs } from "@/features/users-permissions/components/user-list/user-list-tabs";
import { UserListToolbar } from "@/features/users-permissions/components/user-list/user-list-toolbar";
import { useUserList } from "@/features/users-permissions/hooks/use-user-list";
import {
  useDeactivateMemberMutation,
  useReactivateMemberMutation,
} from "@/features/users-permissions/hooks/use-member-mutations";
import { useActivePermissionProfileOptionsQuery } from "@/features/users-permissions/hooks/use-permission-profile-queries";
import type { PlatformUser } from "@/features/users-permissions/types/user";
import type { PermissionProfile } from "@/features/users-permissions/types/permission-profile";

export function UserListPage() {
  const currentUser = useCurrentUser();
  const sessionEmail = currentUser.email.toLowerCase();

  const {
    tab,
    setTab,
    search,
    setSearch,
    matrixId,
    setMatrixId,
    branchId,
    setBranchId,
    functionalRole,
    setFunctionalRole,
    perPage,
    setPage,
    setPerPage,
    result,
    isFetching,
    isError,
    error,
    refresh,
  } = useUserList();

  const profilesQuery = useActivePermissionProfileOptionsQuery();
  const activeProfiles = useMemo<PermissionProfile[]>(
    () =>
      (profilesQuery.data ?? []).map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        isSystem: option.isSystem ?? false,
        systemKey: option.systemKey ?? null,
        permissionIds: [],
        activeMemberCount: 0,
        deletedAt: null,
      })),
    [profilesQuery.data],
  );

  const deactivateMutation = useDeactivateMemberMutation();
  const reactivateMutation = useReactivateMemberMutation();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const users = useMemo(
    () =>
      result.data.map((user) => ({
        ...user,
        isCurrentUser:
          Boolean(sessionEmail) &&
          user.email.toLowerCase() === sessionEmail,
      })),
    [result.data, sessionEmail],
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const pageIds = users.map((user) => user.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedSet.has(id));
  const somePageSelected = pageIds.some((id) => selectedSet.has(id));

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSelectAllPage() {
    setSelectedIds((prev) =>
      allPageSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])],
    );
  }

  async function handleDelete(user: PlatformUser) {
    await deactivateMutation.mutateAsync(user.id);
    setSelectedIds((prev) => prev.filter((id) => id !== user.id));
  }

  async function handleRestore(user: PlatformUser) {
    await reactivateMutation.mutateAsync(user.id);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Usuários & Permissões"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button
              type="button"
              variant="text"
              startIcon={<GroupOutlinedIcon fontSize="small" />}
              onClick={() => setSessionsOpen(true)}
            >
              Sessões ativas
            </Button>
            <Button
              component={Link}
              href="/settings/users-permissions/profiles"
              type="button"
              variant="text"
              startIcon={<ManageAccountsOutlinedIcon fontSize="small" />}
            >
              Gerenciar perfis e permissões
            </Button>
            <Button
              component={Link}
              href="/settings/users-permissions/new"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
            >
              Novo usuário
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        <UserListTabs
          value={tab}
          onValueChange={setTab}
          counts={result.tabCounts}
        />

        <UserListToolbar
          matrixId={matrixId}
          onMatrixIdChange={setMatrixId}
          branchId={branchId}
          onBranchIdChange={setBranchId}
          functionalRole={functionalRole}
          onFunctionalRoleChange={setFunctionalRole}
          search={search}
          onSearchChange={setSearch}
        />

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os usuários"
            message={
              error instanceof Error ? error.message : "Erro inesperado"
            }
            onRetry={() => void refresh()}
          />
        ) : (
          <UserListTable
            users={users}
            profiles={activeProfiles}
            page={result.meta.page}
            perPage={perPage}
            total={result.meta.total}
            isFetching={isFetching}
            selectedIds={selectedSet}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            onToggleSelected={toggleSelected}
            onToggleSelectAllPage={toggleSelectAllPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onDelete={handleDelete}
            onRestore={handleRestore}
          />
        )}
      </ListPagePanel>

      <ActiveSessionsDrawer
        open={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
      />
    </ListPageShell>
  );
}
