"use client";

import { useMemo, useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import {
  Button,
  Input,
  Menu,
  MenuItem,
  NumberInput,
} from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import type { StockTransferLine } from "@/features/stock-transfers/types/stock-transfer";
import type { Product } from "@/features/products/types/product";

type StockTransferProductsTableProps = {
  products: Product[];
  balanceByProductId: Map<string, number>;
  getLine: (productId: string) => StockTransferLine | undefined;
  onQuantityChange: (productId: string, quantity: number) => void;
  onBatchChange: (productId: string, batch: string) => void;
  onRemove: (productId: string) => void;
  emptyMessage?: string;
};

function ProductRowActions({
  productName,
  onRemove,
}: {
  productName: string;
  onRemove: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${productName}`}
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
            onRemove();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remover</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export function StockTransferProductsTable({
  products,
  balanceByProductId,
  getLine,
  onQuantityChange,
  onBatchChange,
  onRemove,
  emptyMessage = "Nenhum produto adicionado.",
}: StockTransferProductsTableProps) {
  const columns = useMemo<DataTableColumn<Product>[]>(
    () => [
      {
        id: "name",
        header: "Produto",
        render: (product) => (
          <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 1.5 }}>
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
                <ImageOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {product.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                {product.sku}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        id: "batch",
        header: "Lote",
        width: 140,
        render: (product) => {
          const line = getLine(product.id);
          return (
            <Input
              value={line?.batch ?? ""}
              onChange={(event) => onBatchChange(product.id, event.target.value)}
              placeholder="—"
              aria-label={`Lote de ${product.name}`}
              sx={{ width: 112 }}
            />
          );
        },
      },
      {
        id: "stock",
        header: "Saldo",
        render: (product) => (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {balanceByProductId.get(product.id) ?? 0}
          </Typography>
        ),
      },
      {
        id: "quantity",
        header: "Quantidade",
        width: 160,
        render: (product) => {
          const line = getLine(product.id);
          return (
            <NumberInput
              value={line?.quantity ?? 0}
              minValue={0}
              step={1}
              onValueChange={(value) => onQuantityChange(product.id, value)}
              aria-label={`Quantidade de ${product.name}`}
              sx={{ width: 144 }}
            />
          );
        },
      },
      {
        id: "actions",
        header: "",
        width: 56,
        align: "right",
        render: (product) => (
          <ProductRowActions
            productName={product.name}
            onRemove={() => onRemove(product.id)}
          />
        ),
      },
    ],
    [balanceByProductId, getLine, onQuantityChange, onBatchChange, onRemove],
  );

  return (
    <DataTable
      columns={columns}
      rows={products}
      getRowId={(product) => product.id}
      emptyMessage={emptyMessage}
    />
  );
}
