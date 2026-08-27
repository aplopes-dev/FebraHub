"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { toast } from "@/ui";
import { Button, ConfirmationDialog, Menu, MenuItem } from "@/ui";
import {
  useDeleteProductMutation,
  useDuplicateProductMutation,
  useRestoreProductMutation,
} from "@/features/products/hooks/use-product-mutations";
import { useStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import type { Product } from "@/features/products/types/product";

type ProductRowActionsProps = {
  product: Product;
};

export function ProductRowActions({ product }: ProductRowActionsProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteProduct = useDeleteProductMutation();
  const restoreProduct = useRestoreProductMutation();
  const duplicateProduct = useDuplicateProductMutation();
  const stocksQuery = useStocksQuery({ search: "", page: 1, perPage: 1 });

  const isDeleted = Boolean(product.deletedAt);
  const menuOpen = Boolean(anchorEl);

  function closeMenu() {
    setAnchorEl(null);
  }

  function goToStock() {
    closeMenu();
    const stockId = stocksQuery.data?.data[0]?.id;
    const query = encodeURIComponent(product.sku);
    if (stockId) {
      router.push(`/estoque/${stockId}?search=${query}`);
      return;
    }
    toast.message("Nenhum estoque cadastrado", {
      description: "Cadastre um estoque para visualizar a posição do produto.",
    });
    router.push("/estoque");
  }

  function goToMovements() {
    closeMenu();
    router.push(
      `/estoque/movimentacoes?search=${encodeURIComponent(product.sku)}`,
    );
  }

  function goToSale() {
    closeMenu();
    router.push("/vendas/novo");
  }

  function handleDuplicate() {
    closeMenu();
    duplicateProduct.mutate(product.id, {
      onSuccess: (created) => {
        router.push(`/catalogo/produtos/${created.id}`);
      },
    });
  }

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
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {isDeleted ? (
          <MenuItem
            onClick={() => {
              closeMenu();
              restoreProduct.mutate(product.id);
            }}
          >
            <ListItemIcon>
              <RestoreIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restaurar</ListItemText>
          </MenuItem>
        ) : (
          [
            <MenuItem key="stock" onClick={goToStock}>
              <ListItemIcon>
                <Inventory2OutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Visualizar estoque</ListItemText>
            </MenuItem>,
            <MenuItem key="movements" onClick={goToMovements}>
              <ListItemIcon>
                <VisibilityOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Ver movimentações</ListItemText>
            </MenuItem>,
            <MenuItem key="sale" onClick={goToSale}>
              <ListItemIcon>
                <PointOfSaleOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Criar nova venda</ListItemText>
            </MenuItem>,
            <Divider key="div" />,
            <MenuItem
              key="edit"
              component={Link}
              href={`/catalogo/produtos/${product.id}`}
              onClick={closeMenu}
            >
              <ListItemIcon>
                <EditOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>,
            <MenuItem
              key="duplicate"
              onClick={handleDuplicate}
              disabled={duplicateProduct.isPending}
            >
              <ListItemIcon>
                <ContentCopyOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {duplicateProduct.isPending ? "Duplicando…" : "Duplicar"}
              </ListItemText>
            </MenuItem>,
            <MenuItem
              key="delete"
              onClick={() => {
                closeMenu();
                setConfirmOpen(true);
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>
                <DeleteOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Excluir</ListItemText>
            </MenuItem>,
          ]
        )}
      </Menu>

      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title="Excluir produto?"
        description={`"${product.name}" sai da listagem, mas continua acessível na aba Excluídos e pode ser restaurado.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmColor="error"
        onConfirm={() => {
          deleteProduct.mutate(product.id);
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
