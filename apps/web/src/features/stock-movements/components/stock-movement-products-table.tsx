"use client";

import { useMemo, useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  CurrencyInput,
  Menu,
  MenuItem,
  NumberInput,
} from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import type { StockMovementLine } from "@/features/stock-movements/types/stock-movement";
import type { Product } from "@/features/products/types/product";
type StockMovementProductsTableProps = {
  products: Product[];
  getLine: (productId: string) => StockMovementLine | undefined;
  onQuantityChange: (productId: string, quantity: number) => void;
  onCostPriceChange: (productId: string, costPrice: number) => void;
  onRemove: (productId: string) => void;
  emptyMessage?: string;
};

function ProductRowActions({
  product,
  onRemove,
}: {
  product: Product;
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
            onRemove(product.id);
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

export function StockMovementProductsTable({
  products,
  getLine,
  onQuantityChange,
  onCostPriceChange,
  onRemove,
  emptyMessage = "Nenhum produto adicionado.",
}: StockMovementProductsTableProps) {
  const columns = useMemo<DataTableColumn<Product>[]>(
    () => [
      {
        id: "name",
        header: "Produto",
        width: 320,
        render: (product) => (
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
        ),
      },
      {
        id: "stock",
        header: "Saldo",
        width: 72,
        render: (product) => (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {product.stock}
          </Typography>
        ),
      },
      {
        id: "quantity",
        header: "Quantidade",
        width: 200,
        render: (product) => {
          const line = getLine(product.id);
          return (
            <NumberInput
              value={line?.quantity ?? 0}
              minValue={0}
              step={1}
              onValueChange={(value) => onQuantityChange(product.id, value)}
              aria-label={`Quantidade de ${product.name}`}
              sx={{ width: 184, minWidth: 184 }}
            />
          );
        },
      },
      {
        id: "costPrice",
        header: "Preço de custo",
        width: 160,
        render: (product) => {
          const line = getLine(product.id);
          return (
            <CurrencyInput
              value={line?.costPrice ?? 0}
              onValueChange={(value) => onCostPriceChange(product.id, value)}
              aria-label={`Preço de custo de ${product.name}`}
              sx={{ width: 144, minWidth: 144 }}
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
          <ProductRowActions product={product} onRemove={onRemove} />
        ),
      },
    ],
    [getLine, onQuantityChange, onCostPriceChange, onRemove],
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
