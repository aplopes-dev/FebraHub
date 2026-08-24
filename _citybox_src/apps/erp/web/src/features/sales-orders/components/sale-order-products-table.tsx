"use client";

import { useMemo, useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import {
  Button,
  CurrencyInput,
  Menu,
  MenuItem,
  NumberInput,
  Typography,
} from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import type { SaleOrderLine } from "@/features/sales-orders/types/sale-order-form";
import type { Product } from "@/features/products/types/product";

type SaleOrderProductRow = {
  product: Product;
  quantity: number;
  unitPrice: number;
};

type SaleOrderProductsTableProps = {
  products: Product[];
  getLine: (productId: string) => SaleOrderLine | undefined;
  disabled?: boolean;
  onQuantityChange: (productId: string, quantity: number) => void;
  onUnitPriceChange: (productId: string, unitPrice: number) => void;
  onRemove: (productId: string) => void;
  emptyMessage?: string;
};

function ProductRowActions({
  productName,
  disabled,
  onRemove,
}: {
  productName: string;
  disabled: boolean;
  onRemove: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações de ${productName}`}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ minWidth: 32, px: 0.5 }}
      >
        <MoreHorizIcon sx={{ fontSize: 16 }} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
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
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remover</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export function SaleOrderProductsTable({
  products,
  getLine,
  disabled = false,
  onQuantityChange,
  onUnitPriceChange,
  onRemove,
  emptyMessage = "Nenhum produto adicionado.",
}: SaleOrderProductsTableProps) {
  const rows = useMemo<SaleOrderProductRow[]>(
    () =>
      products.map((product) => {
        const line = getLine(product.id);
        return {
          product,
          quantity: line?.quantity ?? 0,
          unitPrice: line?.unitPrice ?? 0,
        };
      }),
    [products, getLine],
  );

  const columns = useMemo<DataTableColumn<SaleOrderProductRow>[]>(
    () => [
      {
        id: "name",
        header: "Produto",
        render: (row) => {
          const product = row.product;
          return (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center", minWidth: 0 }}
            >
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
                  <img
                    src={product.imageUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <ImageOutlinedIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {product.name}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: "text.secondary" }}
                >
                  {product.sku}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },
      {
        id: "quantity",
        header: "Qtd.",
        width: 140,
        render: (row) => (
          <NumberInput
            value={row.quantity}
            minValue={0}
            step={1}
            disabled={disabled}
            onValueChange={(value) =>
              onQuantityChange(row.product.id, value)
            }
            aria-label={`Quantidade de ${row.product.name}`}
            sx={{ width: 112 }}
          />
        ),
      },
      {
        id: "unitPrice",
        header: "Preço",
        width: 160,
        render: (row) => (
          <CurrencyInput
            value={row.unitPrice}
            disabled={disabled}
            onValueChange={(value) =>
              onUnitPriceChange(row.product.id, value)
            }
            slotProps={{
              htmlInput: {
                "aria-label": `Preço de ${row.product.name}`,
              },
            }}
            sx={{ width: 144 }}
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
            productName={row.product.name}
            disabled={disabled}
            onRemove={() => onRemove(row.product.id)}
          />
        ),
      },
    ],
    [disabled, onQuantityChange, onUnitPriceChange, onRemove],
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
