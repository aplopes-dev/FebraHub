"use client";

import { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Checkbox } from "@citybox/mui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { SemanticBadge } from "@/components/ui/status";
import { BranchRowActions } from "@/features/branches/components/branch-row-actions";
import { documentLabel, type Branch } from "@/features/branches/types/branch";

type BranchListTableProps = {
  branches: Branch[];
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
  onDelete: (branch: Branch) => void | Promise<void>;
};

export function BranchListTable({
  branches,
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
}: BranchListTableProps) {
  const columns = useMemo<DataTableColumn<Branch>[]>(
    () => [
      {
        id: "select",
        width: 48,
        header: (
          <Checkbox
            slotProps={{
              input: { "aria-label": "Selecionar todas desta página" },
            }}
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            onChange={onToggleSelectAllPage}
          />
        ),
        render: (branch) => (
          <Checkbox
            slotProps={{
              input: { "aria-label": `Selecionar ${branch.displayName}` },
            }}
            checked={selectedIds.has(branch.id)}
            onChange={() => onToggleSelected(branch.id)}
          />
        ),
      },
      {
        id: "name",
        header: "Nome fantasia",
        render: (branch) => (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {branch.displayName}
              </Typography>
              {branch.isHeadquarters ? (
                <SemanticBadge label="Matriz" tone="info" />
              ) : null}
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap>
              {branch.code} · {branch.legalName}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "document",
        header: "CNPJ",
        render: (branch) => (
          <Typography variant="body2" color="text.secondary" noWrap>
            {branch.document || "—"}
            {branch.personType === "PF" ? (
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ ml: 0.75 }}
              >
                ({documentLabel(branch.personType)})
              </Typography>
            ) : null}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (branch) => (
          <BranchRowActions branch={branch} onDelete={onDelete} />
        ),
      },
    ],
    [
      allPageSelected,
      somePageSelected,
      onToggleSelectAllPage,
      selectedIds,
      onToggleSelected,
      onDelete,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={branches}
      getRowId={(branch) => branch.id}
      emptyMessage="Nenhuma unidade encontrada."
      isLoading={isFetching}
      // Sem clique na linha: editar sai pelo menu ⋯ da própria linha.
      pagination={{
        page,
        perPage,
        total,
        onPageChange,
        onPerPageChange,
      }}
    />
  );
}
