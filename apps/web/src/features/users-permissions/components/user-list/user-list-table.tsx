"use client";

import { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Checkbox } from "@/ui";
import { SemanticBadge } from "@/components/ui/status";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { UserProfileSelectCell } from "@/features/users-permissions/components/user-list/user-profile-select-cell";
import { UserRowActions } from "@/features/users-permissions/components/user-list/user-row-actions";
import {
  formatUserFunctionalRole,
  formatUserScopeShort,
  formatUserUnitsSummary,
} from "@/features/users-permissions/lib/user-scope-format";
import type { PermissionProfile } from "@/features/users-permissions/types/permission-profile";
import type { PlatformUser } from "@/features/users-permissions/types/user";

type UserListTableProps = {
  users: PlatformUser[];
  profiles: PermissionProfile[];
  page: number;
  perPage: number;
  total: number;
  isFetching?: boolean;
  selectedIds: Set<string>;
  allPageSelected: boolean;
  somePageSelected: boolean;
  onToggleSelected: (id: string) => void;
  onToggleSelectAllPage: () => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onDelete: (user: PlatformUser) => void | Promise<void>;
  onRestore: (user: PlatformUser) => void | Promise<void>;
};

export function UserListTable({
  users,
  profiles,
  page,
  perPage,
  total,
  isFetching = false,
  selectedIds,
  allPageSelected,
  somePageSelected,
  onToggleSelected,
  onToggleSelectAllPage,
  onPageChange,
  onPerPageChange,
  onDelete,
  onRestore,
}: UserListTableProps) {
  const columns = useMemo<DataTableColumn<PlatformUser>[]>(
    () => [
      {
        id: "select",
        width: 48,
        header: (
          <Checkbox
            slotProps={{ input: { "aria-label": "Selecionar todos desta página" } }}
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            onChange={onToggleSelectAllPage}
          />
        ),
        render: (user) => (
          <Checkbox
            slotProps={{ input: { "aria-label": `Selecionar ${user.name}` } }}
            checked={selectedIds.has(user.id)}
            onChange={() => onToggleSelected(user.id)}
          />
        ),
      },
      {
        id: "user",
        header: "Usuário",
        render: (user) => (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "scope",
        header: "Escopo",
        width: 120,
        render: (user) => (
          <SemanticBadge
            label={formatUserScopeShort(user)}
            tone={user.scopeLevel === "group" ? "info" : "neutral"}
          />
        ),
      },
      {
        id: "role",
        header: "Papel",
        width: 160,
        render: (user) => (
          <Typography variant="body2" noWrap>
            {formatUserFunctionalRole(user)}
          </Typography>
        ),
      },
      {
        id: "units",
        header: "Unidades",
        width: 200,
        render: (user) => (
          <Typography variant="body2" color="text.secondary" noWrap>
            {formatUserUnitsSummary(user)}
          </Typography>
        ),
      },
      {
        id: "profile",
        header: "Perfil de acesso",
        width: 200,
        render: (user) =>
          user.deletedAt == null ? (
            <UserProfileSelectCell user={user} profiles={profiles} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {profiles.find((profile) => profile.id === user.profileId)?.name ?? "—"}
            </Typography>
          ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (user) => (
          <UserRowActions user={user} onDelete={onDelete} onRestore={onRestore} />
        ),
      },
    ],
    [profiles, selectedIds, allPageSelected, somePageSelected, onToggleSelectAllPage, onToggleSelected, onDelete, onRestore],
  );

  return (
    <DataTable
      columns={columns}
      rows={users}
      getRowId={(user) => user.id}
      emptyMessage="Nenhum usuário encontrado."
      isLoading={isFetching}
      pagination={{ page, perPage, total, onPageChange, onPerPageChange }}
    />
  );
}
