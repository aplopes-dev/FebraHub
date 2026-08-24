"use client";

import { useMemo } from "react";
import { Checkbox, Typography } from "@citybox/mui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ActiveStatusBadge, SemanticBadge } from "@/components/ui/status";
import { KdsRowActions } from "@/features/kds/components/kds-row-actions";
import type { Kds, KdsStatus } from "@/features/kds/types/kds";

type KdsListTableProps = {
  kdsList: Kds[];
  page: number;
  perPage: number;
  total: number;
  selectedIds: Set<string>;
  allPageSelected: boolean;
  somePageSelected: boolean;
  onToggleSelected: (id: string) => void;
  onToggleSelectAllPage: () => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onEdit: (kds: Kds) => void;
  onChangeStatus: (kds: Kds, status: KdsStatus) => void;
  onDelete: (kds: Kds) => void | Promise<void>;
};

export function KdsListTable({
  kdsList,
  page,
  perPage,
  total,
  selectedIds,
  allPageSelected,
  somePageSelected,
  onToggleSelected,
  onToggleSelectAllPage,
  onPageChange,
  onPerPageChange,
  onEdit,
  onChangeStatus,
  onDelete,
}: KdsListTableProps) {
  const columns = useMemo<DataTableColumn<Kds>[]>(
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
        render: (kds) => (
          <Checkbox
            slotProps={{ input: { "aria-label": `Selecionar ${kds.name}` } }}
            checked={selectedIds.has(kds.id)}
            onChange={() => onToggleSelected(kds.id)}
          />
        ),
      },
      {
        id: "name",
        header: "Nome",
        render: (kds) => (
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {kds.name}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        width: 140,
        render: (kds) => <ActiveStatusBadge active={kds.status === "active"} />,
      },
      {
        id: "expedition",
        header: "Expedição",
        width: 140,
        render: (kds) => (
          <SemanticBadge
            label={kds.isExpedition ? "Sim" : "Não"}
            tone={kds.isExpedition ? "success" : "neutral"}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (kds) => (
          <KdsRowActions
            kds={kds}
            onEdit={onEdit}
            onChangeStatus={onChangeStatus}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [
      allPageSelected,
      somePageSelected,
      onToggleSelectAllPage,
      selectedIds,
      onToggleSelected,
      onEdit,
      onChangeStatus,
      onDelete,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={kdsList}
      getRowId={(kds) => kds.id}
      emptyMessage="Nenhum KDS encontrado."
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
