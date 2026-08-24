"use client";

import FormControl from "@mui/material/FormControl";
import { MenuItem, Select } from "@citybox/mui";
import type { BranchOption } from "@/lib/api/tenancy";
import { useOrganization } from "@/lib/organization-context";

const ALL_BRANCHES = "all";

function branchLabel(item: BranchOption): string {
  const suffix = item.isHeadquarters ? " (matriz)" : "";
  return `${item.displayName}${suffix}`;
}

export function BranchSwitcher() {
  const {
    branches,
    branchId,
    organization,
    organizationId,
    branchesLoading,
    accessesAllBranches,
    setBranch,
  } = useOrganization();

  if (!organizationId) return null;

  const expectedBranchCount = Math.max(
    organization?.branchCount ?? 0,
    branches.length,
  );

  if (!branchesLoading && expectedBranchCount === 0) return null;

  const ready = !branchesLoading && branches.length > 0;
  const showAllOption = accessesAllBranches && branches.length > 1;

  // MEMBER (ou papel sem acesso total) nunca opera com "todas" — se branchId
  // ainda for null, mostra placeholder até escolher uma unidade.
  const value = !ready
    ? ""
    : branchId
      ? branchId
      : showAllOption
        ? ALL_BRANCHES
        : "";

  return (
    <FormControl
      size="small"
      sx={{ flexShrink: 0, minWidth: 160, maxWidth: 224 }}
    >
      <Select
        value={value}
        displayEmpty
        disabled={!ready}
        aria-label="Unidade"
        onChange={(event) => {
          const next = event.target.value;
          setBranch(next === ALL_BRANCHES ? null : String(next));
        }}
        sx={{ height: 36 }}
      >
        {branchesLoading ? (
          <MenuItem value="">Carregando unidades…</MenuItem>
        ) : branches.length === 0 ? (
          <MenuItem value="">Unidades indisponíveis</MenuItem>
        ) : (
          [
            ...(showAllOption
              ? [
                  <MenuItem key={ALL_BRANCHES} value={ALL_BRANCHES}>
                    Todas as unidades
                  </MenuItem>,
                ]
              : []),
            ...(!branchId && !showAllOption
              ? [
                  <MenuItem key="__pick" value="" disabled>
                    Selecione a unidade
                  </MenuItem>,
                ]
              : []),
            ...branches.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {branchLabel(item)}
              </MenuItem>
            )),
          ]
        )}
      </Select>
    </FormControl>
  );
}
