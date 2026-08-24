"use client";

import Box from "@mui/material/Box";
import { MenuItem, Select, SearchInput } from "@citybox/mui";
import type { PermissionProfile } from "@/features/users-permissions/types/permission-profile";

type UserListToolbarProps = {
  profileId: string;
  onProfileIdChange: (value: string) => void;
  profiles: PermissionProfile[];
  search: string;
  onSearchChange: (value: string) => void;
};

export function UserListToolbar({
  profileId,
  onProfileIdChange,
  profiles,
  search,
  onSearchChange,
}: UserListToolbarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        flexWrap: "wrap",
      }}
    >
      <Select
        size="small"
        value={profileId}
        onChange={(event) => onProfileIdChange(String(event.target.value))}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="all">Perfil acesso: Todos</MenuItem>
        {profiles.map((profile) => (
          <MenuItem key={profile.id} value={profile.id}>
            {profile.name}
          </MenuItem>
        ))}
      </Select>

      <SearchInput
        size="small"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar usuário…"
        sx={{ width: { xs: "100%", sm: 288 } }}
      />
    </Box>
  );
}
