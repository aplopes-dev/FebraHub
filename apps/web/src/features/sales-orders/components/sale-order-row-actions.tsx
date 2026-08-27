"use client";

import { useState } from "react";
import Link from "next/link";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Button, Menu, MenuItem, toast } from "@/ui";
import {
  SALE_ORDER_STATUS_DOT_COLOR,
  SALE_ORDER_STATUS_LABELS,
  SALE_ORDER_STATUS_ORDER,
} from "@/features/sales-orders/lib/sale-order-status";
import { isSaleOrderReadOnly } from "@/features/sales-orders/lib/sale-order-read-only";
import {
  buildSaleOrderPdf,
  buildSaleOrderPdfFileName,
  downloadSaleOrderPdf,
  printSaleOrderPdf,
} from "@/features/sales-orders/lib/build-sale-order-pdf";
import type {
  SaleOrder,
  SaleOrderStatus,
} from "@/features/sales-orders/types/sale-order";

type SaleOrderRowActionsProps = {
  order: SaleOrder;
  onChangeStatus: (id: string, status: SaleOrderStatus) => boolean;
  onDelete: (id: string) => boolean;
};

export function SaleOrderRowActions({
  order,
  onChangeStatus,
  onDelete,
}: SaleOrderRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [statusAnchor, setStatusAnchor] = useState<null | HTMLElement>(null);
  const [nfAnchor, setNfAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const isDeleted = Boolean(order.deletedAt);
  const readOnly = isSaleOrderReadOnly(order);
  const canMutate = !isDeleted && !readOnly;
  const canView = !isDeleted && readOnly;
  const canDelete = !isDeleted;

  function closeMenu() {
    setAnchorEl(null);
    setStatusAnchor(null);
    setNfAnchor(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="text"
        aria-label={`Ações do pedido #${order.number}`}
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
        slotProps={{ paper: { sx: { minWidth: 224 } } }}
      >
        {canMutate ? (
          <MenuItem
            onClick={(event) => setStatusAnchor(event.currentTarget)}
            aria-haspopup="menu"
          >
            <ListItemIcon>
              <SyncOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Alterar status</ListItemText>
            <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </MenuItem>
        ) : null}

        <MenuItem
          onClick={(event) => setNfAnchor(event.currentTarget)}
          aria-haspopup="menu"
        >
          <ListItemIcon>
            <ReceiptLongOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Gerar nota fiscal</ListItemText>
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            closeMenu();
            void printSaleOrderPdf(order, { includeValues: true }).catch(() => {
              toast.error("Não foi possível imprimir o pedido.");
            });
          }}
        >
          <ListItemIcon>
            <PrintOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Imprimir pedido</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            void buildSaleOrderPdf(order, { includeValues: true })
              .then((blob) =>
                downloadSaleOrderPdf(blob, buildSaleOrderPdfFileName(order)),
              )
              .then(() => toast.success("PDF baixado."))
              .catch(() => toast.error("Não foi possível gerar o PDF."));
          }}
        >
          <ListItemIcon>
            <FileDownloadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Baixar PDF</ListItemText>
        </MenuItem>
        {canMutate ? (
          <MenuItem
            onClick={() => {
              closeMenu();
              const ok = onChangeStatus(order.id, "closed");
              if (ok) {
                toast.success("Venda gerada", {
                  description: `Pedido #${order.number} marcado como Fechado.`,
                });
              }
            }}
          >
            <ListItemIcon>
              <ShoppingCartOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Gerar venda</ListItemText>
          </MenuItem>
        ) : null}

        {!isDeleted ? (
          <>
            <Divider />
            {canMutate ? (
              <MenuItem
                component={Link}
                href={`/vendas/pedidos-de-venda/${order.id}`}
                onClick={closeMenu}
              >
                <ListItemIcon>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Editar</ListItemText>
              </MenuItem>
            ) : null}
            {canView ? (
              <MenuItem
                component={Link}
                href={`/vendas/pedidos-de-venda/${order.id}`}
                onClick={closeMenu}
              >
                <ListItemIcon>
                  <VisibilityOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Visualizar</ListItemText>
              </MenuItem>
            ) : null}
            {canDelete ? (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  const ok = onDelete(order.id);
                  if (ok) {
                    toast.success("Pedido excluído", {
                      description: `Pedido #${order.number} movido para Excluídos.`,
                    });
                  }
                }}
                sx={{ color: "error.main" }}
              >
                <ListItemIcon sx={{ color: "error.main" }}>
                  <DeleteOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Excluir</ListItemText>
              </MenuItem>
            ) : null}
          </>
        ) : null}
      </Menu>

      <Menu
        anchorEl={statusAnchor}
        open={Boolean(statusAnchor)}
        onClose={() => setStatusAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 208 } } }}
      >
        {SALE_ORDER_STATUS_ORDER.map((status) => (
          <MenuItem
            key={status}
            disabled={order.status === status}
            onClick={() => {
              closeMenu();
              const ok = onChangeStatus(order.id, status);
              if (ok) {
                toast.success("Status atualizado", {
                  description: `Pedido #${order.number} → ${SALE_ORDER_STATUS_LABELS[status]}.`,
                });
              }
            }}
          >
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: SALE_ORDER_STATUS_DOT_COLOR[status],
                mr: 1.5,
                flexShrink: 0,
              }}
              aria-hidden
            />
            <ListItemText>{SALE_ORDER_STATUS_LABELS[status]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={nfAnchor}
        open={Boolean(nfAnchor)}
        onClose={() => setNfAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 176 } } }}
      >
        <MenuItem disabled sx={{ color: "text.disabled" }}>
          Gerar NFe
        </MenuItem>
        <MenuItem disabled sx={{ color: "text.disabled" }}>
          Gerar NFCe
        </MenuItem>
      </Menu>
    </>
  );
}
