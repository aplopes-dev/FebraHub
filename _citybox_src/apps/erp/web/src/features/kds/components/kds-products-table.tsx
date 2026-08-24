"use client";

import { useMemo } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { Typography } from "@citybox/mui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import type { Product } from "@/features/products/types/product";

type KdsProductsTableProps = {
  products: Product[];
  isLoading?: boolean;
  onRemove: (product: Product) => void | Promise<void>;
};

export function KdsProductsTable({
  products,
  isLoading = false,
  onRemove,
}: KdsProductsTableProps) {
  const columns = useMemo<DataTableColumn<Product>[]>(
    () => [
      {
        id: "name",
        header: "Nome",
        render: (product) => (
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {product.name}
          </Typography>
        ),
      },
      {
        id: "sku",
        header: "Código (SKU)",
        render: (product) => (
          <Typography variant="body2" color="text.secondary" noWrap>
            {product.sku || "—"}
          </Typography>
        ),
      },
      {
        id: "category",
        header: "Categoria",
        render: (product) => (
          <Typography variant="body2" color="text.secondary" noWrap>
            {product.category || "—"}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "Opções",
        width: 88,
        align: "right",
        render: (product) => (
          <RowActionsMenu
            ariaLabel={`Ações de ${product.name}`}
            items={[
              {
                id: "delete",
                label: "Remover do KDS",
                icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
                destructive: true,
                onClick: () => {},
              },
            ]}
            confirmDelete={{
              title: "Remover produto do KDS?",
              description: (
                <>
                  <span style={{ fontWeight: 600 }}>{product.name}</span> deixa de
                  ser enviado para esta tela quando for vendido. O produto
                  continua no catálogo.
                </>
              ),
              confirmLabel: "Remover",
              onConfirm: () => onRemove(product),
            }}
          />
        ),
      },
    ],
    [onRemove],
  );

  return (
    <DataTable
      columns={columns}
      rows={products}
      getRowId={(product) => product.id}
      isLoading={isLoading}
      emptyMessage="Nenhum produto vinculado a este KDS."
    />
  );
}
