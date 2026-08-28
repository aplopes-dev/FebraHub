"use client";

import Box from "@mui/material/Box";
import { MenuItem, Select, SearchInput } from "@/ui";
import { FUNCTIONAL_ROLE_OPTIONS } from "@/features/users-permissions/lib/functional-roles";

type UserListToolbarProps = {
  functionalRole: string;
  onFunctionalRoleChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function UserListToolbar({
  functionalRole,
  onFunctionalRoleChange,
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
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flex: 1 }}>
        <Select
          size="small"
          value={functionalRole}
          onChange={(event) => onFunctionalRoleChange(String(event.target.value))}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Papel: Todos</MenuItem>
          {FUNCTIONAL_ROLE_OPTIONS.map((role) => (
            <MenuItem key={role.value} value={role.value}>
              {role.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

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
