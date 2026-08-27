"use client";

import Box from "@mui/material/Box";
import { MenuItem, Select, SearchInput } from "@/ui";
import { useOrganizationStructureQuery } from "@/features/branches/hooks/use-branch-queries";
import { FUNCTIONAL_ROLE_OPTIONS } from "@/features/users-permissions/lib/functional-roles";
type UserListToolbarProps = {
  matrixId: string;
  onMatrixIdChange: (value: string) => void;
  branchId: string;
  onBranchIdChange: (value: string) => void;
  functionalRole: string;
  onFunctionalRoleChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function UserListToolbar({
  matrixId,
  onMatrixIdChange,
  branchId,
  onBranchIdChange,
  functionalRole,
  onFunctionalRoleChange,
  search,
  onSearchChange,
}: UserListToolbarProps) {
  const structureQuery = useOrganizationStructureQuery();
  const matrices = structureQuery.data?.matrices ?? [];
  const stores =
    matrixId === "all"
      ? Object.values(structureQuery.data?.storesByMatrix ?? {}).flat()
      : (structureQuery.data?.storesByMatrix[matrixId] ?? []);

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
          value={matrixId}
          onChange={(event) => onMatrixIdChange(String(event.target.value))}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">Matriz: Todas</MenuItem>
          {matrices.map((matrix) => (
            <MenuItem key={matrix.id} value={matrix.id}>
              {matrix.displayName}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={branchId}
          onChange={(event) => onBranchIdChange(String(event.target.value))}
          sx={{ minWidth: 180 }}
          disabled={matrixId === "all" && stores.length > 6}
        >
          <MenuItem value="all">Filial: Todas</MenuItem>
          {stores.map((store) => (
            <MenuItem key={store.id} value={store.id}>
              {store.displayName}
            </MenuItem>
          ))}
        </Select>

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
