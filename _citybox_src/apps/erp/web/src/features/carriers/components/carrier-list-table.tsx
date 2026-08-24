"use client";

import { useMemo } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Badge, Tooltip } from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { CarrierRowActions } from "@/features/carriers/components/carrier-row-actions";
import {
  CARRIER_DELIVERY_LABELS,
  documentLabel,
  type Carrier,
} from "@/features/carriers/types/carrier";

type CarrierListTableProps = {
  carriers: Carrier[];
  pageIndex: number;
  pageCount: number;
  totalRowCount: number;
  pageSize: number;
  isFetching?: boolean;
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick?: (carrier: Carrier) => void;
  onEdit: (carrier: Carrier) => void;
  onDelete: (carrier: Carrier) => void;
  onRestore: (carrier: Carrier) => void;
};

export function CarrierListTable({
  carriers,
  pageIndex,
  totalRowCount,
  pageSize,
  isFetching = false,
  onPageIndexChange,
  onPageSizeChange,
  onRowClick,
  onEdit,
  onDelete,
  onRestore,
}: CarrierListTableProps) {
  const columns = useMemo<DataTableColumn<Carrier>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (carrier) => (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {carrier.tradeName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {carrier.legalName || "—"}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "document",
        header: "CPF/CNPJ",
        render: (carrier) => (
          <Typography variant="body2" color="text.secondary">
            {carrier.document || "—"}
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 0.75 }}
            >
              ({documentLabel(carrier.personType)})
            </Typography>
          </Typography>
        ),
      },
      {
        id: "type",
        header: "Tipo",
        render: (carrier) => (
          <Badge
            label={CARRIER_DELIVERY_LABELS[carrier.deliveryType]}
            color="muted"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        ),
      },
      {
        id: "info",
        header: "",
        width: 56,
        align: "center",
        render: (carrier) => {
          const unitsLabel =
            carrier.unitIds.length === 1
              ? "1 unidade"
              : `${carrier.unitIds.length} unidades`;

          return (
            <Box onClick={(event) => event.stopPropagation()}>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {carrier.legalName || carrier.tradeName}
                    </Typography>
                    <Typography variant="caption">
                      {carrier.contact.email || "Sem e-mail"} · {unitsLabel}
                    </Typography>
                  </Box>
                }
              >
                <IconButton
                  type="button"
                  aria-label={`Informações de ${carrier.tradeName}`}
                  sx={{ color: "text.secondary" }}
                >
                  <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (carrier) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <CarrierRowActions
              carrier={carrier}
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
      rows={carriers}
      getRowId={(carrier) => carrier.id}
      emptyMessage="Nenhuma transportadora encontrada."
      onRowClick={onRowClick}
      isLoading={isFetching}
      pagination={{
        page: pageIndex + 1,
        perPage: pageSize,
        total: totalRowCount,
        onPageChange: (nextPage) => onPageIndexChange(nextPage - 1),
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
