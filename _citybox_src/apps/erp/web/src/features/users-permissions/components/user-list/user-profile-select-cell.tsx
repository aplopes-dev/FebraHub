"use client";

import { MenuItem, Select } from "@citybox/mui";
import { useUpdateMemberMutation } from "@/features/users-permissions/hooks/use-member-mutations";
import type { PermissionProfile } from "@/features/users-permissions/types/permission-profile";
import type { PlatformUser } from "@/features/users-permissions/types/user";

type UserProfileSelectCellProps = {
  user: PlatformUser;
  profiles: PermissionProfile[];
};

/**
 * Select inline na linha da listagem — troca o perfil de acesso do usuário
 * sem abrir o formulário.
 */
export function UserProfileSelectCell({
  user,
  profiles,
}: UserProfileSelectCellProps) {
  const updateMutation = useUpdateMemberMutation();

  return (
    <Select
      size="small"
      value={user.profileId}
      disabled={user.isCurrentUser || updateMutation.isPending}
      onChange={(event) => {
        void updateMutation.mutateAsync({
          id: user.id,
          payload: { permissionProfileId: String(event.target.value) },
        });
      }}
      sx={{ minWidth: 176 }}
    >
      {profiles.map((profile) => (
        <MenuItem key={profile.id} value={profile.id}>
          {profile.name}
        </MenuItem>
      ))}
    </Select>
  );
}
