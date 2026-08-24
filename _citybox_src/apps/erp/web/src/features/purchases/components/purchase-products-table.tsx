"use client";

import { useMemo, useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "@citybox/mui";
import {
  Button,
  CurrencyInput,
  Menu,
  MenuItem,
  NumberInput,
} from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { PurchaseLineStatusBadge } from "@/features/purchases/components/purchase-line-status-badge";
import type {
  PurchaseLine,
  PurchaseLineStatus,
} from "@/features/purchases/types/purchase";
import type { Product } from "@/features/products/types/product";

type PurchaseProductRow = {
  product: Product;
  status: PurchaseLineStatus;
  quantity: number;
  costPrice: number;
};

type PurchaseProductsTableProps = {
  products: Product[];
  getLine: (productId: string) => PurchaseLine | undefined;
  onQuantityChange: (productId: string, quantity: number) => void;
  onCostPriceChange: (productId: string, costPrice: number) => void;
  onStatusChange: (productId: string, status: PurchaseLineStatus) => void;
  onRemove: (productId: string) => void;
  emptyMessage?: string;
};

function ProductRowActions({
  product,
  onStatusChange,
  onRemove,
}: {
  product: Product;
  onStatusChange: (productId: string, status: PurchaseLineStatus) => void;
  onRemove: (productId: string) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${product.name}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ minWidth: 32, px: 0.5 }}
      >
        <MoreHorizIcon sx={{ fontSize: 16 }} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onStatusChange(product.id, "received");
          }}
        >
          <ListItemIcon>
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "success.main",
              }}
            />
          </ListItemIcon>
          <ListItemText>Marcar como recebido</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onStatusChange(product.id, "cancelled");
          }}
        >
          <ListItemIcon>
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "text.primary",
              }}
            />
          </ListItemIcon>
          <ListItemText>Marcar como cancelado</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            toast.message("Edite na linha", {
              description:
                "Altere quantidade e preço de custo diretamente na tabela.",
            });
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onRemove(product.id);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export function PurchaseProductsTable({
  products,
  getLine,
  onQuantityChange,
  onCostPriceChange,
  onStatusChange,
  onRemove,
  emptyMessage = "Nenhum produto adicionado.",
}: PurchaseProductsTableProps) {
  const rows = useMemo<PurchaseProductRow[]>(
    () =>
      products.map((product) => {
        const line = getLine(product.id);
        return {
          product,
          status: line?.status ?? "pending",
          quantity: line?.quantity ?? 0,
          costPrice: line?.costPrice ?? 0,
        };
      }),
    [products, getLine],
  );

  const columns = useMemo<DataTableColumn<PurchaseProductRow>[]>(
    () => [
      {
        id: "name",
        header: "Produto",
        render: (row) => {
          const product = row.product;
          return (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "action.hover",
                }}
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Box
                    component="img"
                    src={product.imageUrl}
                    alt=""
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Inventory2OutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {product.name}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                  {product.sku}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        render: (row) => <PurchaseLineStatusBadge status={row.status} />,
      },
      {
        id: "stock",
        header: "Saldo",
        render: (row) => (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {row.product.stock}
          </Typography>
        ),
      },
      {
        id: "quantity",
        header: "Quantidade",
        width: 200,
        render: (row) => (
          <NumberInput
            value={row.quantity}
            minValue={0}
            step={1}
            onValueChange={(value) => onQuantityChange(row.product.id, value)}
            aria-label={`Quantidade de ${row.product.name}`}
            sx={{ width: 184, minWidth: 184 }}
          />
        ),
      },
      {
        id: "costPrice",
        header: "Preço de custo",
        width: 160,
        render: (row) => (
          <CurrencyInput
            value={row.costPrice}
            onValueChange={(value) => onCostPriceChange(row.product.id, value)}
            aria-label={`Preço de custo de ${row.product.name}`}
            sx={{ width: 144, minWidth: 144 }}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (row) => (
          <ProductRowActions
            product={row.product}
            onStatusChange={onStatusChange}
            onRemove={onRemove}
          />
        ),
      },
    ],
    [onQuantityChange, onCostPriceChange, onStatusChange, onRemove],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.product.id}
      emptyMessage={emptyMessage}
    />
  );
}
