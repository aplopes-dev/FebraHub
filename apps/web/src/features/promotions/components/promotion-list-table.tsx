"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Badge, Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { stopRowNavigation } from "@/components/ui/data-table/stop-row-navigation";
import { PromotionRowActions } from "@/features/promotions/components/promotion-row-actions";
import { PromotionStatusBadge } from "@/features/promotions/components/promotion-status-badge";
import {
  formatPromotionPeriod,
  PROMOTION_TYPE_LABELS,
  resolvePromotionStatus,
  type Promotion,
} from "@/features/promotions/types/promotion";

type PromotionListTableProps = {
  promotions: Promotion[];
  /** Página 1-based. */
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
  onRestore: (promotion: Promotion) => void;
};

export function PromotionListTable({
  promotions,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onRestore,
}: PromotionListTableProps) {
  const columns = useMemo<DataTableColumn<Promotion>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (promotion) => (
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {promotion.name}
          </Typography>
        ),
      },
      {
        id: "type",
        header: "Tipo de promoção",
        render: (promotion) => (
          <Badge
            label={PROMOTION_TYPE_LABELS[promotion.type]}
            variant="outlined"
            size="small"
            sx={{
              borderColor: "divider",
              bgcolor: "muted.main",
              color: "muted.contrastText",
              fontWeight: 500,
            }}
          />
        ),
      },
      {
        id: "period",
        header: "Período da promoção",
        render: (promotion) => (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatPromotionPeriod(promotion.startsAt, promotion.endsAt)}
          </Typography>
        ),
      },
      {
        id: "status",
        header: "Status",
        render: (promotion) => (
          <PromotionStatusBadge status={resolvePromotionStatus(promotion)} />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        render: (promotion) => (
          <Box onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
            <PromotionRowActions
              promotion={promotion}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
            />
          </Box>
        ),
      },
    ],
    [onEdit, onDelete, onRestore],
  );

  return (
    <DataTable
      columns={columns}
      rows={promotions}
      getRowId={(promotion) => promotion.id}
      emptyMessage="Nenhuma promoção encontrada."
      getRowHref={(promotion) =>
        promotion.deletedAt ? undefined : `/vendas/promocoes/${promotion.id}`
      }
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
