"use client";

import { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { SemanticBadge } from "@/components/ui/status";
import { PermissionProfileRowActions } from "@/features/users-permissions/components/permission-profile-list/permission-profile-row-actions";
import type { PermissionProfile } from "@/features/users-permissions/types/permission-profile";

type PermissionProfileListTableProps = {
  profiles: PermissionProfile[];
  isFetching?: boolean;
  onDelete: (profile: PermissionProfile) => void | Promise<void>;
  onRestore: (profile: PermissionProfile) => void | Promise<void>;
};

function formatMemberCount(count: number): string {
  if (count === 0) return "Nenhum";
  if (count === 1) return "1 usuário";
  return `${count} usuários`;
}

export function PermissionProfileListTable({
  profiles,
  isFetching = false,
  onDelete,
  onRestore,
}: PermissionProfileListTableProps) {
  const columns = useMemo<DataTableColumn<PermissionProfile>[]>(
    () => [
      {
        id: "name",
        header: "Nome do perfil",
        render: (profile) => (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {profile.name}
              </Typography>
              {profile.isSystem ? (
                <SemanticBadge label="Sistema" tone="info" />
              ) : null}
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap>
              {profile.description || "Sem descrição"}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "members",
        header: "Usuários",
        width: 120,
        render: (profile) => (
          <Typography variant="body2" color="text.secondary">
            {formatMemberCount(profile.activeMemberCount)}
          </Typography>
        ),
      },
      {
        id: "permissions",
        header: "Permissões",
        width: 120,
        render: (profile) => (
          <Typography variant="body2" color="text.secondary">
            {profile.permissionIds.length}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (profile) => (
          <PermissionProfileRowActions
            profile={profile}
            onDelete={onDelete}
            onRestore={onRestore}
          />
        ),
      },
    ],
    [onDelete, onRestore],
  );

  return (
    <DataTable
      columns={columns}
      rows={profiles}
      getRowId={(profile) => profile.id}
      emptyMessage="Nenhum perfil de acesso encontrado."
      isLoading={isFetching}
    />
  );
}
