"use client";

import { useMemo } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { Box, Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { RowActionsMenu } from "@/components/ui/list-page";
import { ActiveStatusBadge } from "@/components/ui/status";
import { PriceListPriorityBadge } from "@/features/price-lists/components/price-list-priority-badge";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";
import {
  formatAdjustmentRule,
  formatBranchesSummary,
  formatChannelsSummary,
  formatValidity,
} from "@/features/price-lists/lib/price-list-format";
import type { PriceList } from "@/features/price-lists/types/price-list";

type PriceListListTableProps = {
  priceLists: PriceList[];
  priorityRankById: Map<string, number>;
  page: number;
  total: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (priceList: PriceList) => void;
  onDelete: (priceList: PriceList) => void | Promise<void>;
};

export function PriceListListTable({
  priceLists,
  priorityRankById,
  page,
  total,
  pageSize,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: PriceListListTableProps) {
  const units = useBranchUnits();
  const branchNameById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.name])),
    [units],
  );

  const columns = useMemo<DataTableColumn<PriceList>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (priceList) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {priceList.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {priceList.productCount} produto
              {priceList.productCount === 1 ? "" : "s"}
            </Typography>
          </Box>
        ),
      },
      {
        id: "priority",
        header: "Prioridade",
        render: (priceList) => (
          <PriceListPriorityBadge
            rank={priorityRankById.get(priceList.id) ?? 0}
          />
        ),
      },
      {
        id: "rule",
        header: "Regra",
        render: (priceList) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatAdjustmentRule(priceList)}
          </Typography>
        ),
      },
      {
        id: "channels",
        header: "Canais",
        render: (priceList) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatChannelsSummary(priceList)}
          </Typography>
        ),
      },
      {
        id: "branches",
        header: "Unidades",
        render: (priceList) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatBranchesSummary(priceList, branchNameById)}
          </Typography>
        ),
      },
      {
        id: "validity",
        header: "Vigência",
        render: (priceList) => (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {formatValidity(priceList)}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (priceList) => (
          <ActiveStatusBadge
            active={priceList.active}
            activeLabel="Ativa"
            inactiveLabel="Inativa"
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (priceList) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <RowActionsMenu
              ariaLabel={`Ações de ${priceList.name}`}
              items={[
                {
                  id: "edit",
                  label: "Editar",
                  icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
                  onClick: () => onEdit(priceList),
                },
                {
                  id: "manage",
                  label: "Gerenciar preços",
                  icon: <Inventory2OutlinedIcon sx={{ fontSize: 16 }} />,
                  href: `/catalogo/lista-de-precos/${priceList.id}`,
                },
                {
                  id: "delete",
                  label: "Excluir",
                  icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
                  onClick: () => undefined,
                  destructive: true,
                  dividerBefore: true,
                },
              ]}
              confirmDelete={{
                title: "Excluir lista de preços?",
                description: (
                  <>
                    Tem certeza que deseja excluir{" "}
                    <span style={{ fontWeight: 600 }}>{priceList.name}</span>?
                    Essa ação não pode ser desfeita.
                  </>
                ),
                onConfirm: () => onDelete(priceList),
              }}
            />
          </Box>
        ),
      },
    ],
    [priorityRankById, branchNameById, onEdit, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      rows={priceLists}
      getRowId={(priceList) => priceList.id}
      emptyMessage="Nenhuma lista de preços encontrada."
      isLoading={isLoading}
      getRowHref={(priceList) => `/catalogo/lista-de-precos/${priceList.id}`}
      pagination={{
        page,
        perPage: pageSize,
        total,
        onPageChange,
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
