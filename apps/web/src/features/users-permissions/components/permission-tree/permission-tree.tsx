"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Checkbox, SearchInput, Typography } from "@/ui";
import { PermissionGroupRow } from "@/features/users-permissions/components/permission-tree/permission-group-row";
import {
  filterPermissionGroups,
  scopeTotals,
  toggleGroupIds,
  toggleItemId,
  toggleScopeIds,
} from "@/features/users-permissions/lib/permission-tree";
import type { PermissionGroup } from "@/features/users-permissions/types/permission-profile";

type PermissionTreeProps = {
  groups: PermissionGroup[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
};

/**
 * Árvore de permissões do cadastro de Perfis de Acesso — busca,
 * "selecionar todos" e grupos expansíveis com contadores.
 */
export function PermissionTree({ groups, selected, onChange }: PermissionTreeProps) {
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const visibleGroups = useMemo(
    () => filterPermissionGroups(groups, search),
    [groups, search],
  );
  const { selectedCount, total } = scopeTotals(groups, selected);
  const allSelected = total > 0 && selectedCount === total;
  const someSelected = selectedCount > 0 && !allSelected;

  function toggleExpanded(groupId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  return (
    <Stack spacing={1.5}>
      <SearchInput
        size="small"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar permissão…"
      />

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() => onChange(toggleScopeIds(groups, selected))}
            slotProps={{ input: { "aria-label": "Selecionar todos os acessos" } }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Selecionar todos os acessos
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {selectedCount} de {total} selecionados
        </Typography>
      </Stack>

      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
        {visibleGroups.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary", p: 2 }}>
            Nenhuma permissão encontrada para “{search}”.
          </Typography>
        ) : (
          visibleGroups.map((group) => (
            <PermissionGroupRow
              key={group.id}
              group={group}
              selected={selected}
              expanded={expandedIds.has(group.id) || Boolean(search.trim())}
              onToggleExpand={() => toggleExpanded(group.id)}
              onToggleGroup={() => onChange(toggleGroupIds(group, selected))}
              onToggleItem={(id) => onChange(toggleItemId(id, selected))}
            />
          ))
        )}
      </Box>
    </Stack>
  );
}
